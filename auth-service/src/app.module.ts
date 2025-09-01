import { Module, Inject } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';



import { RedisModule } from './modules/redis/redis.module';
import { AwsS3Module } from './modules/aws-s3/aws-s3.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { KycModule } from './modules/kyc/kyc.module';
import Redis from 'ioredis';
import { RedisStorage } from './redis-storage';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { EurekaModule } from './eureka/eureka.module';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: `.env.${process.env.NODE_ENV}` || '.env',
      load: [() => ({
        SERVICE_NAME: 'auth-service',
        PORT: process.env.PORT || 3000,
        EUREKA_SERVER_HOST: process.env.EUREKA_SERVER_HOST || 'localhost',
        EUREKA_SERVER_PORT: process.env.EUREKA_SERVER_PORT || 8761,
        EUREKA_INSTANCE_HOSTNAME: process.env.EUREKA_INSTANCE_HOSTNAME || 'localhost',
      })],
    }),
    // EurekaModule,
    ...(isProd
      ? [
        ThrottlerModule.forRoot({
          throttlers: [
            {
              ttl: 60_000,
              limit: 10,
            },
          ],
          storage: new RedisStorage(
            new Redis({
              host: process.env.REDIS_HOST,
              port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
              // password: process.env.REDIS_PASSWORD || undefined,
            }),
          ),
        }),
      ]
      : []),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore,
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        // password: process.env.REDIS_PASSWORD || undefined,
        ttl: 60,
      }),
    }),
    AuthModule,
    RedisModule,
    KycModule,
    AwsS3Module,
    
  ],
  controllers: [AppController],
  providers: [AppService,
    ...(isProd
      ? [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ]
      : []),
  ],
})
export class AppModule { }
