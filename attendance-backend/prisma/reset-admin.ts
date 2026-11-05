import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { assertStrongPassword } from '../src/auth/password-policy.js';

const username = process.argv[2];
const password = process.env.NEW_ADMIN_PASSWORD;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!username || !password) {
    throw new Error(
      'วิธีใช้: ตั้ง NEW_ADMIN_PASSWORD แล้วรัน npm run admin:reset -- <ชื่อผู้ใช้>',
    );
  }
  assertStrongPassword(password, username);

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error(`ไม่พบผู้ใช้ ${username}`);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await argon2.hash(password),
      mustChangePassword: true,
      passwordChangedAt: new Date(), // token เดิมใช้ไม่ได้ทันที
      failedLogins: 0,
      lockedUntil: null,
      isActive: true,
    },
  });
  console.log(`ตั้งรหัสผ่านชั่วคราวให้ ${username} แล้ว (ต้องเปลี่ยนตอนเข้าครั้งแรก)`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());