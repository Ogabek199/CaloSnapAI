import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Prefix: /api/v1
  app.setGlobalPrefix('api/v1');

  // Swagger OpenApi sozlash
  const config = new DocumentBuilder()
    .setTitle('Taom AI — Food Scanner & Nutrition API')
    .setDescription(
      `Taom AI backend servislarining rasmiy REST API hujjatlari.\n\n` +
      `🔥 **Asosiy imkoniyatlar:**\n` +
      `- 📸 **Food Scanner (AI)**: Gemini 2.5 Flash yordamida taom rasmini skanerlash va BJU/kaloriyasini aniqlash\n` +
      `- 🥗 **Foods Database**: Milliy va xalqaro taomlar, porsiyalar va 100g dagi ozuqaviy qiymatlar\n` +
      `- 📖 **Diary**: Kunlik ovqatlanish jurnali, qabul qilingan va qolgan kaloriyalar statistikasi\n` +
      `- 🎯 **Goals & Nutrition**: Mifflin-St Jeor / TDEE formulasi orqali individual kaloriya va makronutrientlar hisobi\n` +
      `- 🔐 **Auth**: JWT Bearer token autentifikatsiyasi va profil boshqaruvi\n\n` +
      `*Taom AI — Smart Health & Food Tracking System*`,
    )
    .setVersion('1.0.0')
    .addTag('Auth', 'Foydalanuvchi autentifikatsiyasi va profil ma’lumotlari (JWT)')
    .addTag('Food Scanner (AI)', 'Gemini AI Vision orqali taomlarni skanerlash va tahlil qilish')
    .addTag('Foods', 'Milliy va jahon taomlari ma’lumotlar bazasi, qidiruv va filtrlash')
    .addTag('Diary', 'Kunlik taomlar jurnali, iste’mol qilingan kaloriyalar va BJU monitoringi')
    .addTag('Goals & Nutrition', 'BMR, TDEE va shaxsiy fitnes maqsadlari bo‘yicha hisob-kitoblar')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT tokenni kiriting (masalan: eyJhbGciOi...)',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Taom AI — API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 24px }
      .swagger-ui .info .title { color: #10B981; font-weight: 800; font-size: 28px; }
      .swagger-ui .btn.authorize { background-color: #10B981; border-color: #10B981; color: #fff; }
      .swagger-ui .btn.authorize svg { fill: #fff; }
      .swagger-ui .opblock.opblock-post { border-color: #49cc90; background: rgba(73,204,144,.05); }
      .swagger-ui .opblock.opblock-get { border-color: #61affe; background: rgba(97,175,254,.05); }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Taom AI Backend server is running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Taom AI Swagger API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
