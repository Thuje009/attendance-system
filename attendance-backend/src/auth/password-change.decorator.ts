import { SetMetadata } from '@nestjs/common';

export const ALLOW_PASSWORD_CHANGE_KEY = 'allowPasswordChange';

// ใช้กับ endpoint ที่บัญชีที่ยังไม่ได้เปลี่ยนรหัสผ่านต้องเรียกได้
export const AllowPasswordChange = () =>
  SetMetadata(ALLOW_PASSWORD_CHANGE_KEY, true);