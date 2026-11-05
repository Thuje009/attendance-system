import { BadRequestException } from '@nestjs/common';

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

const TOO_COMMON = new Set([
  '12345678', '123456789', '1234567890', '11111111', '00000000',
  'password', 'password1', 'password123', 'qwerty123', 'abcd1234',
  'admin123', 'admin1234', 'teacher123', 'teacher1234',
  'school123', 'school1234',
]);

export function assertStrongPassword(
  password: unknown,
  username?: string,
): asserts password is string {
  if (typeof password !== 'string' || password.length === 0) {
    throw new BadRequestException('กรุณากรอกรหัสผ่าน');
  }
  if (password.length < MIN_LENGTH) {
    throw new BadRequestException(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_LENGTH} ตัวอักษร`);
  }
  if (password.length > MAX_LENGTH) {
    throw new BadRequestException(`รหัสผ่านยาวเกิน ${MAX_LENGTH} ตัวอักษร`);
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new BadRequestException(
      'รหัสผ่านต้องมีทั้งตัวอักษรภาษาอังกฤษและตัวเลข',
    );
  }

  const lower = password.toLowerCase();
  if (username && username.length >= 4 && lower.includes(username.toLowerCase())) {
    throw new BadRequestException('รหัสผ่านต้องไม่มีชื่อผู้ใช้อยู่ในนั้น');
  }
  if (TOO_COMMON.has(lower)) {
    throw new BadRequestException('รหัสผ่านนี้เดาง่ายเกินไป กรุณาเลือกใหม่');
  }
}