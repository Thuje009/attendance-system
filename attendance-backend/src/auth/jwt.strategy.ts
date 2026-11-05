import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service.js';

type Payload = { sub: string; role: string; iat?: number };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: Payload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        passwordChangedAt: true,
      },
    });

    if (!user || !user.isActive) throw new UnauthorizedException();

    // token ที่ออกก่อนเปลี่ยน/รีเซ็ตรหัสผ่าน ใช้ไม่ได้อีก
    if (
      user.passwordChangedAt &&
      payload.iat !== undefined &&
      payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      throw new UnauthorizedException();
    }

    // role มาจากฐานข้อมูล ไม่ใช่จาก token
    return {
      id: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }
}