/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import path from 'path';

import { AppModule } from './app.module';
import { ConfigService } from '@nest-modules';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = app
    .get<ConfigService>(ConfigService)
    .get<number>('serverChatApi.port');
  const globalPrefix = 'chat-api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe());
  
  // Update CORS configuration to accept request origin
  app.enableCors({
    origin: true, // This accepts the Origin header from the request
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  const packageJsonPath = path.join(__dirname, '../..', 'package.json');
  const packageJsonString = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonString) as { version: string };

  const options = new DocumentBuilder()
    .setTitle('Chat API')
    .setVersion(packageJson.version)
    .addBearerAuth(
      {
        type: 'http',
      },
      'Authorization'
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('chat/v1/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
