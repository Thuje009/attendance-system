import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ClassroomsService } from '../classrooms/classrooms.service.js';

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
type User = { id: string; role: string };

const STATUSES: Status[] = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

// แปลง "YYYY-MM-DD" เป็น Date (UTC เที่ยงคืน) ให้ตรงกับคอลัมน์ @db.Date
function parseDate(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException('รูปแบบวันที่ต้องเป็น YYYY-MM-DD');
  }
  const d = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException('วันที่ไม่ถูกต้อง');
  }
  return d;
}

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private classrooms: ClassroomsService,
  ) {}

  // ดึงรายชื่อทั้งห้อง พร้อมสถานะของวันนั้น (ยังไม่เช็ก = status เป็น null)
  async getByDate(classroomId: string, date: string, user: User) {
    await this.classrooms.assertAccess(classroomId, user);
    const day = parseDate(date);

    const [enrollments, session] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: {
          classroomId,
          OR: [
            // นักเรียนที่ยังใช้งานอยู่
            { student: { isActive: true } },
            // หรือปิดใช้งานแล้ว แต่เคยถูกเช็คชื่อในวันนี้ (คงประวัติไว้)
            {
              student: {
                records: {
                  some: { session: { classroomId, date: day } },
                },
              },
            },
          ],
        },
        include: { student: true },
        orderBy: { number: 'asc' },
      }),
      this.prisma.attendanceSession.findUnique({
        where: { classroomId_date: { classroomId, date: day } },
        include: { records: true },
      }),
    ]);

    const recordMap = new Map(
      (session?.records ?? []).map((r) => [r.studentId, r]),
    );

    return {
      date,
      checked: !!session,
      students: enrollments.map((e) => ({
        studentId: e.studentId,
        number: e.number,
        studentCode: e.student.studentCode,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        status: recordMap.get(e.studentId)?.status ?? null,
        note: recordMap.get(e.studentId)?.note ?? null,
      })),
    };
  }


  // บันทึกทั้งห้องในคำขอเดียว (กดซ้ำ/แก้ไขได้)
  async save(
    classroomId: string,
    body: {
      date: string;
      records: { studentId: string; status: Status; note?: string }[];
    },
    user: User,
  ) {
    await this.classrooms.assertAccess(classroomId, user);
    const day = parseDate(body.date);

    if (!Array.isArray(body.records) || body.records.length === 0) {
      throw new BadRequestException('ไม่มีรายการเช็คชื่อ');
    }

    // ตรวจสถานะ
    for (const r of body.records) {
      if (!STATUSES.includes(r.status)) {
        throw new BadRequestException(`สถานะไม่ถูกต้อง: ${r.status}`);
      }
    }

    // ตรวจว่านักเรียนทุกคนอยู่ในชั้นนี้จริง
    const enrolled = await this.prisma.enrollment.findMany({
      where: { classroomId },
      select: { studentId: true },
    });
    const allowed = new Set(enrolled.map((e) => e.studentId));
    const outsiders = body.records.filter((r) => !allowed.has(r.studentId));
    if (outsiders.length > 0) {
      throw new BadRequestException('มีนักเรียนที่ไม่ได้อยู่ในชั้นเรียนนี้');
    }

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.attendanceSession.upsert({
        where: { classroomId_date: { classroomId, date: day } },
        update: {},
        create: { classroomId, date: day, takenById: user.id },
      });

      for (const r of body.records) {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: session.id,
              studentId: r.studentId,
            },
          },
          update: { status: r.status, note: r.note ?? null },
          create: {
            sessionId: session.id,
            studentId: r.studentId,
            status: r.status,
            note: r.note ?? null,
          },
        });
      }

      return { sessionId: session.id, date: body.date, saved: body.records.length };
    });
  }
}