import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { json } from 'express';
import { AppModule } from './app.module';

// Clients send local calendar days (YYYY-MM-DD) and "today" is computed server-side, so the process
// must run in the users' timezone rather than the container default (UTC on Railway).
process.env.TZ = process.env.TZ || 'Asia/Tashkent';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  // Railway terminates TLS at its proxy; needed so rate limiting sees the real client IP.
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: isProd ? undefined : false }));
  // Scan images and avatars arrive as base64 JSON (~8 MB image => ~11 MB string). Only those routes
  // get the large limit; body-parser skips already-parsed bodies, so everything else stays at 1 MB.
  app.use(
    ['/api/v1/food-scans', '/api/v1/auth/avatar', '/api/v1/foods/nutrition-label', '/api/v1/assistant/chef'],
    json({ limit: '15mb' }),
  );
  app.useBodyParser('json', { limit: '1mb' });
  app.enableShutdownHooks();

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Native mobile clients don't send Origin, so CORS only matters for browsers.
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : !isProd,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Legal pages are linked from store listings, so they live at short URLs outside the API prefix.
  app.setGlobalPrefix('api/v1', { exclude: [{ path: 'legal/:page', method: RequestMethod.GET }] });

  if (!isProd) {
    setupSwagger(app);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`CaloSnap API listening on port ${port} (prefix /api/v1)`);
  if (!isProd) {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

function setupSwagger(app: NestExpressApplication) {
  const config = new DocumentBuilder()
    .setTitle('CaloSnap — Food Scanner & Nutrition API')
    .setDescription(
      `CaloSnap backend servislarining rasmiy REST API hujjatlari.\n\n` +
      `🔥 **Asosiy imkoniyatlar:**\n` +
      `- 📸 **Food Scanner (AI)**: Gemini 2.5 Flash yordamida taom rasmini skanerlash va BJU/kaloriyasini aniqlash\n` +
      `- 🥗 **Foods Database**: Milliy va xalqaro taomlar, porsiyalar va 100g dagi ozuqaviy qiymatlar\n` +
      `- 📖 **Diary**: Kunlik ovqatlanish jurnali, qabul qilingan va qolgan kaloriyalar statistikasi\n` +
      `- 🎯 **Goals & Nutrition**: Mifflin-St Jeor / TDEE formulasi orqali individual kaloriya va makronutrientlar hisobi\n` +
      `- 🔐 **Auth**: JWT Bearer token autentifikatsiyasi va profil boshqaruvi\n\n` +
      `*CaloSnap — Smart Health & Food Tracking System*`,
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
    customSiteTitle: 'CaloSnap — API Documentation',
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
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error('Failed to start application', err?.stack || err);
  process.exit(1);
});
