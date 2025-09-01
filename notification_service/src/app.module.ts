import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationModule } from './modules/notification/notification.module';
import { ConfigModule } from '@nestjs/config';

import { KafkaModule } from './kafka/kafka.module';
import { ChannelModule } from './modules/channel/channel.module';
import { EurekaModule } from 'nestjs-eureka';

import { GrpcModule } from './modules/grpc/notification-server/grpc.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    NotificationModule,
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
    ChannelModule,
    GrpcModule,
    CacheModule.register({isGlobal: true}),
    EurekaModule.forRoot({
      eureka: {
        host: process.env.EUREKA_HOSTNAME,
        port: 8761,
        servicePath: '/eureka/apps/',
        registryFetchInterval: 15000,
        statusPageUrl: process.env.HOSTURL,
      },
      service: {
        name: process.env.HOSTNAME ?? 'notification_service',
        port: Number(process.env.PORT) || 3005,
      },
    }) as any,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
