import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { kafkaConfig } from './config/kafka.config';
import { AllExceptionsFilter } from 'pipe/exceptions.pipe';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.enableCors();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: process.env.GRPC_URL,
      package: 'notification',
      protoPath: join(process.cwd(), 'proto/notification.proto'),
    },
  });

  app.connectMicroservice<MicroserviceOptions>(kafkaConfig);

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3005);
  console.log(
    `Notification Service is running on port ${process.env.PORT ?? 3005}`,
  );
}
bootstrap();
