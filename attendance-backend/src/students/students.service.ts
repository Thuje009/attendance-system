import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

type CreateInput = {
  studentCode: string;
  firstName: string;
  lastName: string;
  classroomId?: string;
  number?: number;
};

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
              select: { id: true, grade: true, room: true, academicYear: true },
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

    // สร้างนักเรียน + ใส่เข้าชั้น ใน query เดียว (atomic)
    return this.prisma.student.create({
      data: {
        studentCode,
        firstName,
        lastName,
        enrollments: input.classroomId
          ? { create: { classroomId: input.classroomId, number } }
          : undefined,
      },
      include: { enrollments: true },
    });
  }

  async update(
    id: string,
    data: { firstName?: string; lastName?: string; isActive?: boolean },
  ) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('ไม่พบนักเรียน');

    return this.prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName?.trim() || undefined,
        lastName: data.lastName?.trim() || undefined,
        isActive: data.isActive,
      },
    });
  }
}