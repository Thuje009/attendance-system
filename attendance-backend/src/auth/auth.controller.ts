import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AllowPasswordChange } from './password-change.decorator.js';

type AuthReq = { user: { id: string; role: string } };

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.auth.login(body?.username, body?.password);
  }

  @AllowPasswordChange()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthReq) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        mustChangePassword: true,
      },
    });
  }

  @AllowPasswordChange()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @Req() req: AuthReq,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.auth.changePassword(
      req.user.id,
      body?.currentPassword,
      body?.newPassword,
    );
  }
}