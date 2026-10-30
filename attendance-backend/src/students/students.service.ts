import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.student.findMany({ orderBy: { studentCode: 'asc' } });
  }

  create(data: { studentCode: string; firstName: string; lastName: string }) {
    return this.prisma.student.create({ data });
  }
}