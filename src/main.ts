import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import express from 'express';

let cachedApp: any = null;

async function createApp() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      skipMissingProperties: true,
    }),
  );

  await app.init();
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Blog Backend API')
    .setDescription('The Blog Backend API Documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('user', 'User management endpoints')
    .addTag('mushroom', 'Mushroom management endpoints')
    .addTag('system', 'System endpoints')
    .addApiKey({
      type: 'apiKey',
      name: 'x-access-token',
      in: 'header',
      description: 'JWT token passed via x-access-token header',
    }, 'x-access-token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  
  // Add global security to all endpoints
  const paths = document.paths || {};
  Object.keys(paths).forEach((pathKey) => {
    const path = paths[pathKey];
    if (path) {
      Object.keys(path).forEach((methodKey) => {
        if (path[methodKey] && !path[methodKey].security) {
          path[methodKey].security = [{ 'x-access-token': [] }];
        }
      });
    }
  });
  
  SwaggerModule.setup('api', app, document);
  
  return expressApp;
}

export const handler = async (req: any, res: any) => {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  return cachedApp(req, res);
};

// For local development
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      skipMissingProperties: true,
    }),
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('TPD Backend API')
    .setDescription('The TPD Backend API Documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('user', 'User management endpoints')
    .addTag('mushroom', 'Mushroom management endpoints')
    .addTag('system', 'System endpoints')
    .addApiKey({
      type: 'apiKey',
      name: 'x-access-token',
      in: 'header',
      description: 'JWT token passed via x-access-token header',
    }, 'x-access-token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  
  // Add global security to all endpoints
  const paths = document.paths || {};
  Object.keys(paths).forEach((pathKey) => {
    const path = paths[pathKey];
    if (path) {
      Object.keys(path).forEach((methodKey) => {
        if (path[methodKey] && !path[methodKey].security) {
          path[methodKey].security = [{ 'x-access-token': [] }];
        }
      });
    }
  });
  
  SwaggerModule.setup('api', app, document);

  // Wait a moment for all connections to initialize
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  await app.listen(port);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

// Only run bootstrap in development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  bootstrap();
}