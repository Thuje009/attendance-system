import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { StudentsService, type ImportRowInput } from './students.service.js';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // ข้อมูลนักเรียนทั้งโรงเรียน เฉพาะแอดมิน
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  findAll() {
    return this.students.findAll();
  }

  @Post()
  create(
    @Body()
    body: {
      studentCode: string;
      firstName: string;
      lastName: string;
      classroomId?: string;
      number?: number;
      prefix?: string;
      birthDate?: string;
      fatherName?: string;
      motherName?: string;
      guardianName?: string;
      phone?: string;
    },
  ) {
    return this.students.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
      prefix?: string;
      birthDate?: string;
      fatherName?: string;
      motherName?: string;
      guardianName?: string;
      phone?: string;
    },
  ) {
    return this.students.update(id, body);
  }

  @Post('import')
  importRows(
    @Body()
    body: { classroomId: string; commit?: boolean; rows: ImportRowInput[] },
  ) {
    return this.students.importToClassroom(
      body.classroomId,
      body.rows,
      body.commit === true,
    );
  }
}