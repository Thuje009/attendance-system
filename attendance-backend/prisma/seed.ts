import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('ตั้ง SEED_ADMIN_PASSWORD (อย่างน้อย 8 ตัว) ก่อนรัน seed');
  }

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: await argon2.hash(password),
      fullName: 'ผู้ดูแลระบบ',
      role: 'ADMIN',
      mustChangePassword: true, // ต้องตั้งรหัสใหม่ตอนเข้าครั้งแรก
    },
  });
  console.log('Seed เสร็จ: สร้างบัญชี admin แล้ว (ต้องเปลี่ยนรหัสตอนเข้าครั้งแรก)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());