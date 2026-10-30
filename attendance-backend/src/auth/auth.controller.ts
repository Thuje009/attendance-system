import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma.service.js';

@Controller('auth')
export class AuthController {
 constructor(
    private auth: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.auth.login(body.username, body.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: { user: { id: string; role: string } }) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: req.user.id },
      select: { id: true, username: true, fullName: true, role: true },
    });
  }
  
}