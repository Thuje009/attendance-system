import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service.js';
import { assertStrongPassword } from '../auth/password-policy.js';

// field ที่ส่งกลับได้ (ห้ามส่ง passwordHash ออกไป)
const publicSelect = {
  id: true,
  username: true,
  fullName: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
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
    const username = data.username?.trim();
    const fullName = data.fullName?.trim();
    if (!username || !fullName) {
      throw new BadRequestException('กรุณากรอกชื่อผู้ใช้และชื่อ-นามสกุล');
    }
    assertStrongPassword(data.password, username);

    const exists = await this.prisma.user.findUnique({ where: { username } });
    if (exists) throw new ConflictException('ชื่อผู้ใช้นี้ถูกใช้แล้ว');

    return this.prisma.user.create({
      data: {
        username,
        passwordHash: await argon2.hash(data.password),
        fullName,
        role: data.role ?? 'TEACHER',
        // รหัสที่แอดมินตั้งให้ เจ้าของบัญชีต้องเปลี่ยนก่อนใช้งาน
        mustChangePassword: true,
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

    let passwordData = {};
    if (typeof data.password === 'string' && data.password.length > 0) {
      assertStrongPassword(data.password, user.username);
      passwordData = {
        passwordHash: await argon2.hash(data.password),
        mustChangePassword: true,
        passwordChangedAt: new Date(), // token เดิมของบัญชีนี้ใช้ไม่ได้ทันที
        failedLogins: 0,
        lockedUntil: null, // รีเซ็ตรหัส = ปลดล็อกบัญชีด้วย
      };
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName?.trim() || undefined,
        isActive: data.isActive,
        ...passwordData,
      },
      select: publicSelect,
    });
  }
}