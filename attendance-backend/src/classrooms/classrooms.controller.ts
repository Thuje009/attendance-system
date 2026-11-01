import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Delete,

} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ClassroomsService } from './classrooms.service.js';

type AuthReq = { user: { id: string; role: string } };

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomsController {
  constructor(private readonly classrooms: ClassroomsService) { }

  // ครู/แอดมิน: ชั้นของฉัน
  @Get('mine')
  mine(@Req() req: AuthReq) {
    return this.classrooms.findMine(req.user);
  }

  // ครู/แอดมิน: รายชื่อนักเรียนในชั้น (ตรวจสิทธิ์ใน service)
  @Get(':id/students')
  students(@Param('id') id: string, @Req() req: AuthReq) {
    return this.classrooms.findStudents(id, req.user);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: { level?: 'KINDERGARTEN' | 'PRIMARY'; grade: number; room?: number; academicYear: number }) {
    return this.classrooms.create(body);
  }

  @Roles('ADMIN')
  @Post(':id/teachers')
  assignTeacher(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.classrooms.assignTeacher(id, body.userId);
  }

  @Roles('ADMIN')
  @Post(':id/students')
  enroll(
    @Param('id') id: string,
    @Body() body: { studentId: string; number?: number },
  ) {
    return this.classrooms.enrollStudent(id, body.studentId, body.number);
  }


  @Roles('ADMIN')
  @Get('all')
  all() {
    return this.classrooms.findAllForAdmin();
  }

  @Roles('ADMIN')
  @Delete(':id/teachers/:userId')
  removeTeacher(@Param('id') id: string, @Param('userId') userId: string) {
    return this.classrooms.removeTeacher(id, userId);
  }

  @Roles('ADMIN')
  @Delete(':id/students/:studentId')
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.classrooms.removeStudent(id, studentId);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classrooms.remove(id);
  }

}