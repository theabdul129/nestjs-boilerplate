import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  // filter out endpoints you want to exclude from swagger
  // const filterEndpoints = (path: string) => {
  //   // Exclude Apple and Google sign-in endpoints
  //   return (
  //     !path.includes('/api/v1/auth/apple/login') &&
  //     !path.includes('/api/v1/auth/google/login') &&
  //     !path.includes('/api/v1/auth/twitter/login') &&
  //     !path.includes('/api/v1/auth/facebook/login')
  //   );
  // };

  // // Exclude specific routes from the Swagger documentation
  // document.paths = Object.fromEntries(
  //   Object.entries(document.paths).filter(([path]) => filterEndpoints(path)),
  // );

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
