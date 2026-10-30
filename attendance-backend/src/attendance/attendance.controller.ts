import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { AttendanceService } from './attendance.service.js';

type AuthReq = { user: { id: string; role: string } };

@Controller('classrooms/:id/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get()
  get(
    @Param('id') id: string,
    @Query('date') date: string,
    @Req() req: AuthReq,
  ) {
    return this.attendance.getByDate(id, date, req.user);
  }

  @Put()
  save(
    @Param('id') id: string,
    @Body()
    body: {
      date: string;
      records: {
        studentId: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
        note?: string;
      }[];
    },
    @Req() req: AuthReq,
  ) {
    return this.attendance.save(id, body, req.user);
  }
}