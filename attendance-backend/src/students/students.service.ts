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
}