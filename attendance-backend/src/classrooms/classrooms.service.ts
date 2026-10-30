import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  // แอดมินเห็นทุกชั้น, ครูเห็นเฉพาะชั้นที่ถูกมอบหมาย
  findMine(user: { id: string; role: string }) {
    return this.prisma.classroom.findMany({
      where:
        user.role === 'ADMIN'
          ? undefined
          : { teachers: { some: { userId: user.id } } },
      orderBy: [{ academicYear: 'desc' }, { grade: 'asc' }, { room: 'asc' }],
      include: { _count: { select: { enrollments: true } } },
    });
  }

  async create(data: { grade: number; room?: number; academicYear: number }) {
    try {
      return await this.prisma.classroom.create({
        data: {
          grade: data.grade,
          room: data.room ?? 1,
          academicYear: data.academicYear,
        },
      });
    } catch {
      throw new ConflictException('มีชั้นเรียนนี้อยู่แล้ว');
    }
  }

  async assignTeacher(classroomId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('ไม่พบครู');
    return this.prisma.teacherClassroom.upsert({
      where: { userId_classroomId: { userId, classroomId } },
      update: {},
      create: { userId, classroomId },
    });
  }

  async enrollStudent(classroomId: string, studentId: string, number?: number) {
    return this.prisma.enrollment.upsert({
      where: { studentId_classroomId: { studentId, classroomId } },
      update: { number },
      create: { studentId, classroomId, number },
    });
  }

  // ตรวจสิทธิ์: ครูต้องอยู่ในชั้นนี้ (แอดมินผ่านเสมอ)
  async assertAccess(classroomId: string, user: { id: string; role: string }) {
    if (user.role === 'ADMIN') return;
    const link = await this.prisma.teacherClassroom.findUnique({
      where: { userId_classroomId: { userId: user.id, classroomId } },
    });
    if (!link) throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึงชั้นเรียนนี้');
  }

  async findStudents(classroomId: string, user: { id: string; role: string }) {
    await this.assertAccess(classroomId, user);
    return this.prisma.enrollment.findMany({
      where: { classroomId },
      include: { student: true },
      orderBy: { number: 'asc' },
    });
  }

  // แอดมิน: ทุกชั้นพร้อมรายชื่อครูและจำนวนนักเรียน
  findAllForAdmin() {
    return this.prisma.classroom.findMany({
      orderBy: [{ academicYear: 'desc' }, { grade: 'asc' }, { room: 'asc' }],
      include: {
        _count: { select: { enrollments: true } },
        teachers: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });
  }

  async removeTeacher(classroomId: string, userId: string) {
    await this.prisma.teacherClassroom.deleteMany({
      where: { classroomId, userId },
    });
    return { removed: true };
  }

  async removeStudent(classroomId: string, studentId: string) {
    await this.prisma.enrollment.deleteMany({
      where: { classroomId, studentId },
    });
    return { removed: true };
  }


    async remove(classroomId: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: { _count: { select: { enrollments: true, sessions: true } } },
    });
    if (!classroom) throw new NotFoundException('ไม่พบชั้นเรียน');

    if (classroom._count.enrollments > 0) {
      throw new ConflictException(
        'ไม่สามารถลบได้ เพราะมีนักเรียนอยู่ในชั้นนี้ (ย้ายนักเรียนออกก่อน)',
      );
    }
    if (classroom._count.sessions > 0) {
      throw new ConflictException(
        'ไม่สามารถลบได้ เพราะมีประวัติการเช็คชื่อแล้ว',
      );
    }

    // ถอดครูออกและลบชั้นใน transaction เดียว
    await this.prisma.$transaction([
      this.prisma.teacherClassroom.deleteMany({ where: { classroomId } }),
      this.prisma.classroom.delete({ where: { id: classroomId } }),
    ]);
    return { removed: true };
  }

}