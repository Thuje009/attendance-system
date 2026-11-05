import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

// ถ้าตั้งค่าไม่ครบ ให้ล้มทันทีพร้อมข้อความที่อ่านออก ดีกว่าเปิดระบบที่ครึ่งๆ กลางๆ
function checkEnv() {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter(
    (k) => !process.env[k],
  );
  if (missing.length > 0) {
    console.error(`ตั้งค่าไม่ครบ ขาดตัวแปร: ${missing.join(', ')}`);
    process.exit(1);
  }
  if ((process.env.JWT_SECRET ?? '').length < 32) {
    console.error('JWT_SECRET สั้นเกินไป (ต้องอย่างน้อย 32 ตัวอักษร)');
    process.exit(1);
  }
}

async function bootstrap() {
  checkEnv();

  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  // เบราว์เซอร์ไม่ได้เรียก backend ตรง (เรียกผ่านเซิร์ฟเวอร์ Next.js)
  // ตั้งไว้เป็นชั้นป้องกันเพิ่ม ไม่ใช่ตัวป้องกันหลัก เพราะ backend บน Render เข้าถึงได้จากอินเทอร์เน็ต
  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });

  // Render ส่งพอร์ตมาทางตัวแปร PORT และต้องฟังที่ 0.0.0.0
  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}
bootstrap();