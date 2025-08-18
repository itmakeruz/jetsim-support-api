import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpCode, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: '*', credentials: true });
  app.setGlobalPrefix('chat');

  const config = new DocumentBuilder()
    .setTitle('Support chat')
    .setDescription('The Support chat API description')
    .setVersion('0.2.1')
    .addBearerAuth(
      {
        description: 'Please enter token in following format: Bearer <JWT>',
        type: 'http',
        scheme: 'Bearer',
        bearerFormat: 'Bearer',
        in: 'Header',
      },
      'access_token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(3000);
}
bootstrap();
