import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseFormatterInterceptor } from './common/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from 'pipe/exceptions.pipe';
// import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  
  // Set port from environment or default to 3000
  const port = configService.get<number>('PORT', 3000);
  
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  console.log('Server starting on port:', port);
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const reflector = app.get(Reflector)
  app.useGlobalInterceptors(new ResponseFormatterInterceptor(reflector));
  // app.use(helmet());
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});
