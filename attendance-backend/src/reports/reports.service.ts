import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ClassroomsService } from '../classrooms/classrooms.service.js';

type User = { id: string; role: string };
type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

const MAX_RANGE_DAYS = 366;

function parseDate(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException('รูปแบบวันที่ต้องเป็น YYYY-MM-DD');
  }
  const d = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) {
    throw new BadRequestException('วันที่ไม่ถูกต้อง');
  }
  return d;
}

const emptyCounts = (): Record<Status, number> => ({
  PRESENT: 0,
  ABSENT: 0,
  LATE: 0,
  LEAVE: 0,
});

// อัตรามาเรียน (%) ทศนิยม 1 ตำแหน่ง, null ถ้ายังไม่มีบันทึก
const rateOf = (present: number, late: number, recorded: number) =>
  recorded > 0 ? Math.round(((present + late) / recorded) * 1000) / 10 : null;

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private classrooms: ClassroomsService,
  ) {}

  async classSummary(
    classroomId: string,
    from: string,
    to: string,
    user: User,
  ) {
    await this.classrooms.assertAccess(classroomId, user);

    const start = parseDate(from);
    const end = parseDate(to);
    if (start > end) {
      throw new BadRequestException('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
    }
    if ((end.getTime() - start.getTime()) / 86_400_000 > MAX_RANGE_DAYS) {
      throw new BadRequestException(
        `เลือกช่วงวันที่ได้ไม่เกิน ${MAX_RANGE_DAYS} วัน`,
      );
    }

    const dateFilter = { gte: start, lte: end };

    const [classroom, enrollments, sessions] = await Promise.all([
      this.prisma.classroom.findUnique({
        where: { id: classroomId },
        select: { grade: true, room: true, academicYear: true },
      }),
      this.prisma.enrollment.findMany({
        where: {
          classroomId,
          OR: [
            { student: { isActive: true } },
            // ปิดใช้งานแล้ว แต่มีบันทึกในช่วงนี้ ให้คงอยู่ในรายงาน
            {
              student: {
                records: {
                  some: { session: { classroomId, date: dateFilter } },
                },
              },
            },
          ],
        },
        include: { student: true },
        orderBy: { number: 'asc' },
      }),
      this.prisma.attendanceSession.findMany({
        where: { classroomId, date: dateFilter },
        select: {
          date: true,
          records: { select: { studentId: true, status: true } },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    if (!classroom) throw new NotFoundException('ไม่พบชั้นเรียน');

    const perStudent = new Map<string, Record<Status, number>>();

    const days = sessions.map((s) => {
      const c = emptyCounts();
      for (const r of s.records) {
        c[r.status]++;
        const sc = perStudent.get(r.studentId) ?? emptyCounts();
        sc[r.status]++;
        perStudent.set(r.studentId, sc);
      }
      return {
        date: s.date.toISOString().slice(0, 10),
        present: c.PRESENT,
        absent: c.ABSENT,
        late: c.LATE,
        leave: c.LEAVE,
        total: s.records.length,
      };
    });

    const students = enrollments.map((e) => {
      const c = perStudent.get(e.studentId) ?? emptyCounts();
      const recorded = c.PRESENT + c.ABSENT + c.LATE + c.LEAVE;
      return {
        studentId: e.studentId,
        number: e.number,
        studentCode: e.student.studentCode,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        isActive: e.student.isActive,
        present: c.PRESENT,
        absent: c.ABSENT,
        late: c.LATE,
        leave: c.LEAVE,
        recorded,
        rate: rateOf(c.PRESENT, c.LATE, recorded),
      };
    });

    const totals = days.reduce(
      (t, d) => ({
        days: t.days + 1,
        present: t.present + d.present,
        absent: t.absent + d.absent,
        late: t.late + d.late,
        leave: t.leave + d.leave,
      }),
      { days: 0, present: 0, absent: 0, late: 0, leave: 0 },
    );

    return { classroom, range: { from, to }, totals, students, days };
  }
}