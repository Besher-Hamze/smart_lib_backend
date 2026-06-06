import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const adminRoot = existsSync(join(process.cwd(), 'public', 'admin'))
    ? join(process.cwd(), 'public', 'admin')
    : join(__dirname, 'public', 'admin');
  app.useStaticAssets(adminRoot, { prefix: '/admin' });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Smart Lib API  → http://localhost:${port}/api`);
  console.log(`Admin panel (HTML) → http://localhost:${port}/admin/`);
}
bootstrap();
