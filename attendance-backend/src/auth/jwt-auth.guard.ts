import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ALLOW_PASSWORD_CHANGE_KEY } from './password-change.decorator.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ok = (await super.canActivate(context)) as boolean;
    if (!ok) return false;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { mustChangePassword?: boolean } }>();

    // ต้องเปลี่ยนรหัสผ่านก่อน: อนุญาตเฉพาะ endpoint ที่ติดป้าย @AllowPasswordChange()
    if (user?.mustChangePassword) {
      const allowed = this.reflector.getAllAndOverride<boolean>(
        ALLOW_PASSWORD_CHANGE_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!allowed) {
        throw new ForbiddenException({
          statusCode: 403,
          message: 'ต้องเปลี่ยนรหัสผ่านก่อนใช้งานระบบ',
          code: 'PASSWORD_CHANGE_REQUIRED',
        });
      }
    }
    return true;
  }
}