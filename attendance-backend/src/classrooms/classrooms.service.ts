import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) { }

  // แอดมินเห็นทุกชั้น, ครูเห็นเฉพาะชั้นที่ถูกมอบหมาย
  findMine(user: { id: string; role: string }) {
    return this.prisma.classroom.findMany({
      where:
        user.role === 'ADMIN'
          ? undefined
          : { teachers: { some: { userId: user.id } } },
      orderBy: [{ academicYear: 'desc' }, { level: 'asc' }, { grade: 'asc' }, { room: 'asc' }],
      include: {
        _count: {
          select: {
            enrollments: { where: { student: { isActive: true } } },
          },
        },
      },
    });
  }

  async create(data: {
    level?: 'KINDERGARTEN' | 'PRIMARY';
    grade: number;
    room?: number;
    academicYear: number;
  }) {
    const level = data.level ?? 'PRIMARY';
    if (level !== 'KINDERGARTEN' && level !== 'PRIMARY') {
      throw new BadRequestException('ระดับชั้นไม่ถูกต้อง');
    }

    const maxGrade = level === 'KINDERGARTEN' ? 3 : 6;
    const room = data.room ?? 1;

    if (!Number.isInteger(data.grade) || data.grade < 1 || data.grade > maxGrade) {
      throw new BadRequestException(`ชั้นต้องอยู่ระหว่าง 1 ถึง ${maxGrade}`);
    }
    if (!Number.isInteger(room) || room < 1) {
      throw new BadRequestException('เลขห้องไม่ถูกต้อง');
    }
    if (!Number.isInteger(data.academicYear) || data.academicYear < 2500) {
      throw new BadRequestException('ปีการศึกษาต้องเป็น พ.ศ.');
    }

    const exists = await this.prisma.classroom.findUnique({
      where: {
        level_grade_room_academicYear: {
          level,
          grade: data.grade,
          room,
          academicYear: data.academicYear,
        },
      },
    });
    if (exists) throw new ConflictException('มีชั้นเรียนนี้อยู่แล้ว');

    return this.prisma.classroom.create({
      data: { level, grade: data.grade, room, academicYear: data.academicYear },
    });
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
      select: {
        studentId: true,
        classroomId: true,
        number: true,
        student: {
          select: {
            id: true,
            studentCode: true,
            prefix: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
      orderBy: { number: 'asc' },
    });
  }

  // แอดมิน: ทุกชั้นพร้อมรายชื่อครูและจำนวนนักเรียน
  findAllForAdmin() {
    return this.prisma.classroom.findMany({
      orderBy: [{ academicYear: 'desc' }, { level: 'asc' }, { grade: 'asc' }, { room: 'asc' }],
      include: {
        _count: {
          select: {
            enrollments: { where: { student: { isActive: true } } },
          },
        },
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