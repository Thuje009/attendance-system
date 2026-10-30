import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service.js';

// field ที่ส่งกลับได้ (ห้ามส่ง passwordHash ออกไป)
const publicSelect = {
  id: true,
  username: true,
  fullName: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: publicSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: {
    username: string;
    password: string;
    fullName: string;
    role?: 'ADMIN' | 'TEACHER';
  }) {
    const exists = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (exists) throw new ConflictException('ชื่อผู้ใช้นี้ถูกใช้แล้ว');

    return this.prisma.user.create({
      data: {
        username: data.username,
        passwordHash: await argon2.hash(data.password),
        fullName: data.fullName,
        role: data.role ?? 'TEACHER',
      },
      select: publicSelect,
    });
  }

  async update(
    id: string,
    data: { fullName?: string; password?: string; isActive?: boolean },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้');

    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        isActive: data.isActive,
        passwordHash: data.password
          ? await argon2.hash(data.password)
          : undefined,
      },
      select: publicSelect,
    });
  }
}