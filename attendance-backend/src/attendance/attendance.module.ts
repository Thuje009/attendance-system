import { Module } from '@nestjs/common';
import { ClassroomsModule } from '../classrooms/classrooms.module.js';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceService } from './attendance.service.js';

@Module({
  imports: [ClassroomsModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}