import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @Roles('ADMIN')
  @Post()
  create(
    @Body() body: { studentCode: string; firstName: string; lastName: string },
  ) {
    return this.studentsService.create(body);
  }
}