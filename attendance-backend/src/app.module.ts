import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma.module.js';
import { StudentsModule } from './students/students.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ClassroomsModule } from './classrooms/classrooms.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { ReportsModule } from './reports/reports.module.js';

@Module({
  imports: [PrismaModule, StudentsModule, AuthModule, UsersModule, ClassroomsModule, AttendanceModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}