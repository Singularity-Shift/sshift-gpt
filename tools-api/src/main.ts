/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ConfigService } from '@nest-modules';
import path from 'path';
import { readFileSync } from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = app
    .get<ConfigService>(ConfigService)
    .get<number>('serverToolsApi.port');
  const globalPrefix = 'tools';
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  const packageJsonPath = path.join(__dirname, '../..', 'package.json');
  const packageJsonString = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonString) as { version: string };

  const options = new DocumentBuilder()
    .setTitle('Tools API')
    .setVersion(packageJson.version)
    .addBearerAuth(
      {
        type: 'http',
      },
      'Authorization'
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('tools/v1/docs', app, document);

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
