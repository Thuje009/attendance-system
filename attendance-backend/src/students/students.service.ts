import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

type Profile = {
  prefix?: string;
  birthDate?: string; // YYYY-MM-DD (ค.ศ.), ส่งสตริงว่างเพื่อล้างค่า
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  phone?: string;
};

type CreateInput = Profile & {
  studentCode: string;
  firstName: string;
  lastName: string;
  classroomId?: string;
  number?: number;
};

type UpdateInput = Profile & {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
};

type ProfileData = {
  prefix?: string | null;
  birthDate?: Date | null;
  fatherName?: string | null;
  motherName?: string | null;
  guardianName?: string | null;
  phone?: string | null;
};

const clean = (v?: string | null) => {
  const s = v?.trim();
  return s ? s : null;
};

function parseBirthDate(v: string): Date | null {
  if (v.trim() === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    throw new BadRequestException('รูปแบบวันเกิดต้องเป็น YYYY-MM-DD');
  }
  const d = new Date(`${v}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
    throw new BadRequestException('วันเกิดไม่ถูกต้อง');
  }
  if (d > new Date()) {
    throw new BadRequestException('วันเกิดต้องไม่เป็นวันในอนาคต');
  }
  return d;
}

function cleanPhone(v: string): string | null {
  const s = clean(v);
  if (!s) return null;
  const digits = s.replace(/[\s\-().]/g, '');
  if (!/^\+?\d{8,15}$/.test(digits)) {
    throw new BadRequestException('เบอร์โทรไม่ถูกต้อง');
  }
  return digits;
}

// แปลงเฉพาะฟิลด์ที่ส่งมา (undefined = ไม่แตะ, สตริงว่าง = ล้างค่า)
function profileData(p: Profile): ProfileData {
  const out: ProfileData = {};
  if (p.prefix !== undefined) out.prefix = clean(p.prefix);
  if (p.birthDate !== undefined) out.birthDate = parseBirthDate(p.birthDate);
  if (p.fatherName !== undefined) out.fatherName = clean(p.fatherName);
  if (p.motherName !== undefined) out.motherName = clean(p.motherName);
  if (p.guardianName !== undefined) out.guardianName = clean(p.guardianName);
  if (p.phone !== undefined) out.phone = cleanPhone(p.phone);
  return out;
}

export type ImportRowInput = {
  number?: number | null;
  studentCode?: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  phone?: string;
};

export type ImportRowResult = {
  index: number;
  studentCode: string;
  name: string;
  number: number | null;
  action: 'create' | 'update' | 'error';
  errors: string[];
};

const MAX_IMPORT_ROWS = 200;
const blank = (v?: string) => (v && v.trim() ? v : undefined);
const levelShort = (level: string) => (level === 'KINDERGARTEN' ? 'อ.' : 'ป.');

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.student.findMany({
      orderBy: { studentCode: 'asc' },
      include: {
        enrollments: {
          orderBy: { classroom: { academicYear: 'desc' } },
          select: {
            number: true,
            classroom: {
              select: {
                id: true,
                level: true,
                grade: true,
                room: true,
                academicYear: true,
              },
            },
          },
        },
      },
    });
  }

  async create(input: CreateInput) {
    const studentCode = input.studentCode?.trim();
    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();
    const number = input.number ?? undefined;

    if (!studentCode || !firstName || !lastName) {
      throw new BadRequestException('กรุณากรอกรหัสประจำตัว ชื่อ และนามสกุล');
    }
    if (number !== undefined && (!Number.isInteger(number) || number < 1)) {
      throw new BadRequestException('เลขที่ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป');
    }

    const profile = profileData(input);

    const duplicate = await this.prisma.student.findUnique({
      where: { studentCode },
    });
    if (duplicate) throw new ConflictException('รหัสประจำตัวนี้มีอยู่แล้ว');

    if (input.classroomId) {
      const classroom = await this.prisma.classroom.findUnique({
        where: { id: input.classroomId },
      });
      if (!classroom) throw new NotFoundException('ไม่พบชั้นเรียน');

      if (number !== undefined) {
        const taken = await this.prisma.enrollment.findFirst({
          where: { classroomId: input.classroomId, number },
        });
        if (taken) {
          throw new ConflictException(`เลขที่ ${number} ถูกใช้แล้วในชั้นนี้`);
        }
      }
    }

    return this.prisma.student.create({
      data: {
        studentCode,
        firstName,
        lastName,
        ...profile,
        enrollments: input.classroomId
          ? { create: { classroomId: input.classroomId, number } }
          : undefined,
      },
      include: { enrollments: true },
    });
  }

  async update(id: string, data: UpdateInput) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('ไม่พบนักเรียน');

    return this.prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName?.trim() || undefined,
        lastName: data.lastName?.trim() || undefined,
        isActive: data.isActive,
        ...profileData(data),
      },
    });
  }

  // commit=false → ตรวจอย่างเดียว (ตัวอย่างผล), commit=true → บันทึกจริง
  async importToClassroom(
    classroomId: string,
    rows: ImportRowInput[],
    commit: boolean,
  ) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('ไม่มีข้อมูลให้นำเข้า');
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `นำเข้าได้ครั้งละไม่เกิน ${MAX_IMPORT_ROWS} แถว`,
      );
    }

    const classroom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
    });
    if (!classroom) throw new NotFoundException('ไม่พบชั้นเรียน');

    const codes = rows
      .map((r) => r.studentCode?.trim())
      .filter((c): c is string => !!c);

    const [existing, inClass] = await Promise.all([
      this.prisma.student.findMany({
        where: { studentCode: { in: codes } },
        select: {
          id: true,
          studentCode: true,
          enrollments: {
            select: {
              classroomId: true,
              classroom: {
                select: {
                  level: true,
                  grade: true,
                  room: true,
                  academicYear: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { classroomId },
        select: { studentId: true, number: true },
      }),
    ]);

    const byCode = new Map(existing.map((s) => [s.studentCode, s] as const));
    const holderOf = new Map<number, string>();
    for (const e of inClass) {
      if (e.number !== null) holderOf.set(e.number, e.studentId);
    }

    const seenCodes = new Set<string>();
    const seenNumbers = new Set<number>();
    const valid: {
      code: string;
      firstName: string;
      lastName: string;
      number: number | null;
      profile: ProfileData;
    }[] = [];
    const results: ImportRowResult[] = [];

    rows.forEach((r, i) => {
      const errors: string[] = [];
      const code = r.studentCode?.trim() ?? '';
      const firstName = r.firstName?.trim() ?? '';
      const lastName = r.lastName?.trim() ?? '';

      if (!code) errors.push('ไม่มีเลขประจำตัว');
      if (!firstName) errors.push('ไม่มีชื่อ');
      if (!lastName) errors.push('ไม่มีนามสกุล');

      let number: number | null = null;
      if (r.number !== undefined && r.number !== null) {
        if (Number.isInteger(r.number) && r.number >= 1) number = r.number;
        else errors.push('เลขที่ไม่ถูกต้อง');
      }

      let profile: ProfileData = {};
      try {
        profile = profileData({
          prefix: blank(r.prefix),
          birthDate: blank(r.birthDate),
          fatherName: blank(r.fatherName),
          motherName: blank(r.motherName),
          guardianName: blank(r.guardianName),
          phone: blank(r.phone),
        });
      } catch (e) {
        errors.push((e as Error).message);
      }

      if (code) {
        if (seenCodes.has(code)) errors.push('เลขประจำตัวซ้ำกันในข้อมูลที่วาง');
        seenCodes.add(code);
      }
      if (number !== null) {
        if (seenNumbers.has(number)) {
          errors.push(`เลขที่ ${number} ซ้ำกันในข้อมูลที่วาง`);
        }
        seenNumbers.add(number);
      }

      const found = code ? byCode.get(code) : undefined;

      // นักเรียนเดิมที่อยู่ชั้นอื่นในปีการศึกษาเดียวกัน
      const clash = found?.enrollments.find(
        (e) =>
          e.classroomId !== classroomId &&
          e.classroom.academicYear === classroom.academicYear,
      );
      if (clash) {
        errors.push(
          `อยู่ชั้น ${levelShort(clash.classroom.level)}${clash.classroom.grade}/${clash.classroom.room} ในปีการศึกษานี้แล้ว`,
        );
      }

      if (number !== null) {
        const holder = holderOf.get(number);
        if (holder && holder !== found?.id) {
          errors.push(`เลขที่ ${number} ถูกใช้แล้วในชั้นนี้`);
        }
      }

      results.push({
        index: i + 1,
        studentCode: code,
        name: `${firstName} ${lastName}`.trim(),
        number,
        action: errors.length > 0 ? 'error' : found ? 'update' : 'create',
        errors,
      });

      if (errors.length === 0) {
        valid.push({ code, firstName, lastName, number, profile });
      }
    });

    if (commit && valid.length > 0) {
      await this.prisma.$transaction(
        async (tx) => {
          for (const v of valid) {
            const student = await tx.student.upsert({
              where: { studentCode: v.code },
              create: {
                studentCode: v.code,
                firstName: v.firstName,
                lastName: v.lastName,
                ...v.profile,
              },
              // ฟิลด์ที่ไม่ได้ส่งมา (undefined) จะไม่ถูกแตะ ข้อมูลเดิมไม่ถูกลบ
              update: {
                firstName: v.firstName,
                lastName: v.lastName,
                ...v.profile,
              },
              select: { id: true },
            });

            await tx.enrollment.upsert({
              where: {
                studentId_classroomId: { studentId: student.id, classroomId },
              },
              create: { studentId: student.id, classroomId, number: v.number },
              update: v.number !== null ? { number: v.number } : {},
            });
          }
        },
        { timeout: 30_000 },
      );
    }

    const count = (a: ImportRowResult['action']) =>
      results.filter((r) => r.action === a).length;

    return {
      committed: commit && valid.length > 0,
      summary: {
        create: count('create'),
        update: count('update'),
        error: count('error'),
      },
      rows: results,
    };
  }

}