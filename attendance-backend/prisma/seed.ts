import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234';

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
  console.log('Seed เสร็จ: บัญชี admin (ต้องเปลี่ยนรหัสผ่านตอนเข้าครั้งแรก)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());