import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service.js';
import { assertStrongPassword } from './password-policy.js';

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const INVALID = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';

type SafeUser = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
};

@Injectable()
export class AuthService {
  private dummyHash?: Promise<string>;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ใช้ตรวจรหัสปลอมเมื่อไม่พบผู้ใช้ เพื่อให้เวลาตอบสนองใกล้เคียงกัน (กันการเดาชื่อผู้ใช้)
  private dummy() {
    this.dummyHash ??= argon2.hash('dummy-password-for-timing');
    return this.dummyHash;
  }

  private sign(user: { id: string; role: string }) {
    return this.jwt.signAsync({ sub: user.id, role: user.role });
  }

  private safe(u: SafeUser): SafeUser {
    return {
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      mustChangePassword: u.mustChangePassword,
    };
  }

  private tooManyAttempts(until: Date) {
    const mins = Math.max(
      1,
      Math.ceil((until.getTime() - Date.now()) / 60_000),
    );
    return new HttpException(
      `ลองผิดหลายครั้ง บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่ในอีก ${mins} นาที`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  // นับครั้งที่ผิด แล้วล็อกเมื่อครบ คืนเวลาที่ล็อกถึง (หรือ null ถ้ายังไม่ล็อก)
  private async registerFailure(userId: string): Promise<Date | null> {
    const { failedLogins } = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });
    if (failedLogins < MAX_FAILS) return null;

    const until = new Date(Date.now() + LOCK_MINUTES * 60_000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLogins: 0, lockedUntil: until },
    });
    return until;
  }

  async login(username: string, password: string) {
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username ||
      !password
    ) {
      throw new UnauthorizedException(INVALID);
    }

    const user = await this.prisma.user.findUnique({ where: { username } });

    if (!user) {
      await argon2.verify(await this.dummy(), password).catch(() => false);
      throw new UnauthorizedException(INVALID);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw this.tooManyAttempts(user.lockedUntil);
    }

    const valid = await argon2
      .verify(user.passwordHash, password)
      .catch(() => false);

    if (!valid) {
      const lockedUntil = await this.registerFailure(user.id);
      if (lockedUntil) throw this.tooManyAttempts(lockedUntil);
      throw new UnauthorizedException(INVALID);
    }

    if (!user.isActive) throw new UnauthorizedException(INVALID);

    if (user.failedLogins > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: 0, lockedUntil: null },
      });
    }

    return { accessToken: await this.sign(user), user: this.safe(user) };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (typeof currentPassword !== 'string' || !currentPassword) {
      throw new BadRequestException('กรุณากรอกรหัสผ่านปัจจุบัน');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException();

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw this.tooManyAttempts(user.lockedUntil);
    }

    const valid = await argon2
      .verify(user.passwordHash, currentPassword)
      .catch(() => false);

    if (!valid) {
      const lockedUntil = await this.registerFailure(user.id);
      if (lockedUntil) throw this.tooManyAttempts(lockedUntil);
      // ใช้ 400 ไม่ใช่ 401 เพราะ 401 จะทำให้หน้าเว็บเด้งไปหน้าล็อกอิน
      throw new BadRequestException('รหัสผ่านปัจจุบันไม่ถูกต้อง');
    }

    assertStrongPassword(newPassword, user.username);
    if (newPassword === currentPassword) {
      throw new BadRequestException('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await argon2.hash(newPassword),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    // token เก่าทั้งหมดใช้ไม่ได้แล้ว จึงออกใบใหม่ให้ ผู้ใช้ไม่ต้องล็อกอินซ้ำ
    return { accessToken: await this.sign(updated), user: this.safe(updated) };
  }
}