import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

type Level = 'KINDERGARTEN' | 'PRIMARY';

export type PromotionInput = {
  fromYear: number;
  toYear: number;
  copyTeachers?: boolean;
  graduate?: boolean;
  excludeStudentIds?: string[];
};

type PlanStudent = {
  studentId: string;
  studentCode: string;
  name: string;
  number: number | null; // เลขที่เดิม
  newNumber: number | null; // เลขที่ในชั้นใหม่ (null = เว้นว่าง)
  status: 'move' | 'already' | 'excluded';
};

type PlanGroup = {
  source: { id: string; level: Level; grade: number; room: number };
  target: { level: Level; grade: number; room: number; exists: boolean } | null;
  teachers: { id: string; fullName: string }[];
  students: PlanStudent[];
  numberCleared: number;
};

// อ.1→อ.2→อ.3→ป.1→...→ป.6 (null = จบการศึกษา)
function nextClass(level: Level, grade: number) {
  if (level === 'KINDERGARTEN') {
    return grade < 3
      ? { level, grade: grade + 1 }
      : { level: 'PRIMARY' as Level, grade: 1 };
  }
  return grade < 6 ? { level, grade: grade + 1 } : null;
}

const keyOf = (l: Level, g: number, r: number) => `${l}-${g}-${r}`;

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  private validate(input: PromotionInput) {
    const { fromYear, toYear } = input;
    const ok = (y: number) => Number.isInteger(y) && y >= 2500 && y <= 2700;
    if (!ok(fromYear) || !ok(toYear)) {
      throw new BadRequestException('ปีการศึกษาต้องเป็น พ.ศ. (จำนวนเต็ม)');
    }
    if (toYear <= fromYear) {
      throw new BadRequestException('ปีปลายทางต้องมากกว่าปีต้นทาง');
    }
    const ex = input.excludeStudentIds;
    if (
      ex !== undefined &&
      (!Array.isArray(ex) ||
        ex.length > 2000 ||
        ex.some((x) => typeof x !== 'string'))
    ) {
      throw new BadRequestException('รายการนักเรียนที่ไม่เลื่อนไม่ถูกต้อง');
    }
  }

  private async buildPlan(input: PromotionInput): Promise<PlanGroup[]> {
    const exclude = new Set(input.excludeStudentIds ?? []);

    const [sources, targets] = await Promise.all([
      this.prisma.classroom.findMany({
        where: { academicYear: input.fromYear },
        orderBy: [{ level: 'asc' }, { grade: 'asc' }, { room: 'asc' }],
        include: {
          teachers: {
            include: {
              user: { select: { id: true, fullName: true, isActive: true } },
            },
          },
          enrollments: {
            where: { student: { isActive: true } },
            orderBy: { number: 'asc' },
            select: {
              studentId: true,
              number: true,
              student: {
                select: {
                  studentCode: true,
                  prefix: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.classroom.findMany({
        where: { academicYear: input.toYear },
        select: {
          level: true,
          grade: true,
          room: true,
          enrollments: { select: { studentId: true, number: true } },
        },
      }),
    ]);

    const targetByKey = new Map(
      targets.map((t) => [keyOf(t.level, t.grade, t.room), t] as const),
    );
    // นักเรียนที่อยู่ในชั้นของปีใหม่อยู่แล้ว
    const placedNext = new Set(
      targets.flatMap((t) => t.enrollments.map((e) => e.studentId)),
    );

    return sources.map((src) => {
      const next = nextClass(src.level, src.grade);
      const existing = next
        ? targetByKey.get(keyOf(next.level, next.grade, src.room))
        : undefined;

      const taken = new Set(
        (existing?.enrollments ?? [])
          .map((e) => e.number)
          .filter((n): n is number => n !== null),
      );
      let numberCleared = 0;

      const students = src.enrollments.map((e): PlanStudent => {
        const base = {
          studentId: e.studentId,
          studentCode: e.student.studentCode,
          name: `${e.student.prefix ?? ''}${e.student.firstName} ${e.student.lastName}`.trim(),
          number: e.number,
        };

        if (exclude.has(e.studentId)) {
          return { ...base, newNumber: null, status: 'excluded' };
        }
        if (placedNext.has(e.studentId)) {
          return { ...base, newNumber: null, status: 'already' };
        }

        let newNumber: number | null = null;
        if (next && e.number !== null) {
          if (!taken.has(e.number)) {
            taken.add(e.number);
            newNumber = e.number;
          } else {
            numberCleared++;
          }
        }
        return { ...base, newNumber, status: 'move' };
      });

      return {
        source: {
          id: src.id,
          level: src.level,
          grade: src.grade,
          room: src.room,
        },
        target: next
          ? { level: next.level, grade: next.grade, room: src.room, exists: !!existing }
          : null,
        teachers: src.teachers
          .filter((t) => t.user.isActive)
          .map((t) => ({ id: t.user.id, fullName: t.user.fullName })),
        students,
        numberCleared,
      };
    });
  }

  private totals(groups: PlanGroup[]) {
    const t = { classesToCreate: 0, move: 0, graduate: 0, already: 0, excluded: 0 };
    for (const g of groups) {
      if (g.target && !g.target.exists) t.classesToCreate++;
      for (const s of g.students) {
        if (s.status === 'already') t.already++;
        else if (s.status === 'excluded') t.excluded++;
        else if (g.target) t.move++;
        else t.graduate++;
      }
    }
    return t;
  }

  async preview(input: PromotionInput) {
    this.validate(input);
    const groups = await this.buildPlan(input);
    if (groups.length === 0) {
      throw new NotFoundException(
        `ไม่พบชั้นเรียนของปีการศึกษา ${input.fromYear}`,
      );
    }
    return {
      fromYear: input.fromYear,
      toYear: input.toYear,
      groups,
      totals: this.totals(groups),
    };
  }

  async apply(input: PromotionInput) {
    this.validate(input);
    const groups = await this.buildPlan(input);
    if (groups.length === 0) {
      throw new NotFoundException(
        `ไม่พบชั้นเรียนของปีการศึกษา ${input.fromYear}`,
      );
    }

    const copyTeachers = input.copyTeachers === true;
    const graduate = input.graduate !== false;

    await this.prisma.$transaction(
      async (tx) => {
        for (const g of groups) {
          const moving = g.students.filter((s) => s.status === 'move');

          if (g.target) {
            const target = await tx.classroom.upsert({
              where: {
                level_grade_room_academicYear: {
                  level: g.target.level,
                  grade: g.target.grade,
                  room: g.target.room,
                  academicYear: input.toYear,
                },
              },
              create: {
                level: g.target.level,
                grade: g.target.grade,
                room: g.target.room,
                academicYear: input.toYear,
              },
              update: {},
              select: { id: true },
            });

            if (moving.length > 0) {
              await tx.enrollment.createMany({
                data: moving.map((s) => ({
                  studentId: s.studentId,
                  classroomId: target.id,
                  number: s.newNumber,
                })),
                skipDuplicates: true,
              });
            }

            if (copyTeachers && g.teachers.length > 0) {
              await tx.teacherClassroom.createMany({
                data: g.teachers.map((t) => ({
                  userId: t.id,
                  classroomId: target.id,
                })),
                skipDuplicates: true,
              });
            }
          } else if (graduate && moving.length > 0) {
            await tx.student.updateMany({
              where: { id: { in: moving.map((s) => s.studentId) } },
              data: { isActive: false },
            });
          }
        }
      },
      { timeout: 60_000 },
    );

    const totals = this.totals(groups);
    return {
      toYear: input.toYear,
      ...totals,
      graduated: graduate ? totals.graduate : 0,
    };
  }

  // ยกเลิกการเลื่อนชั้นของปีที่เลือก (ลบชั้นปีนั้นพร้อมการลงทะเบียนและครู)
  async undo(year: number) {
    if (!Number.isInteger(year) || year < 2500) {
      throw new BadRequestException('ปีการศึกษาไม่ถูกต้อง');
    }

    const classes = await this.prisma.classroom.findMany({
      where: { academicYear: year },
      select: { id: true, _count: { select: { sessions: true } } },
    });
    if (classes.length === 0) {
      throw new NotFoundException(`ไม่มีชั้นเรียนของปีการศึกษา ${year}`);
    }
    if (classes.some((c) => c._count.sessions > 0)) {
      throw new ConflictException(
        `ยกเลิกไม่ได้ เพราะปี ${year} มีประวัติเช็คชื่อแล้ว`,
      );
    }

    // กันพลาดลบปีแรกของระบบ (ข้อมูลตั้งต้นของโรงเรียน)
    const earlier = await this.prisma.classroom.count({
      where: { academicYear: { lt: year } },
    });
    if (earlier === 0) {
      throw new ConflictException('ยกเลิกปีแรกของระบบไม่ได้');
    }

    const ids = classes.map((c) => c.id);
    await this.prisma.$transaction([
      this.prisma.enrollment.deleteMany({ where: { classroomId: { in: ids } } }),
      this.prisma.teacherClassroom.deleteMany({
        where: { classroomId: { in: ids } },
      }),
      this.prisma.classroom.deleteMany({ where: { id: { in: ids } } }),
    ]);

    return { removedClassrooms: ids.length };
  }
}