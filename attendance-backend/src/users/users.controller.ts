import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // ทั้ง controller เฉพาะแอดมิน
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Post()
  create(
    @Body()
    body: {
      username: string;
      password: string;
      fullName: string;
      role?: 'ADMIN' | 'TEACHER';
    },
  ) {
    return this.users.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { fullName?: string; password?: string; isActive?: boolean },
  ) {
    return this.users.update(id, body);
  }
}