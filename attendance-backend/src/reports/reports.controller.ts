import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ReportsService } from './reports.service.js';

type AuthReq = { user: { id: string; role: string } };

@Controller('classrooms/:id/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  summary(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: AuthReq,
  ) {
    return this.reports.classSummary(id, from, to, req.user);
  }
}