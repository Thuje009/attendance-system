import { Module } from '@nestjs/common';
import { ClassroomsModule } from '../classrooms/classrooms.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [ClassroomsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}