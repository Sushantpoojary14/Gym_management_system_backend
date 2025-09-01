import { Module, Inject } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/user/entities/user.entity';
import { SessionModule } from './modules/session/session.module';
import { ReferralModule } from './modules/referral/referral.module';
import { RedisModule } from './modules/redis/redis.module';
import { AwsS3Module } from './modules/aws-s3/aws-s3.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { KycModule } from './modules/kyc/kyc.module';
import Redis from 'ioredis';
import { RedisStorage } from './redis-storage';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { PoliciesModule } from './modules/policies/policies.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { UserCouponModule } from './modules/user-coupon/user-coupon.module';
import { FaqsModule } from './modules/faqs/faqs.module';
import { ChatModule } from './modules/chat/chat.module';
import { MailModule } from './modules/mail/mail.module';
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
    EurekaModule,
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
              password: process.env.REDIS_PASSWORD || undefined,
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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: "localhost",
        port: 5432,
        username: "postgres",
        password: "postgres",
        database: "authdb",
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') !== 'production',
        // ssl: {
        //   rejectUnauthorized: false,
        // },
        entities: [
          User,
        ]
      }),
    }),

    UserModule,
    AuthModule,
    SessionModule,
    ReferralModule,
    RedisModule,
    KycModule,
    AwsS3Module,
    PoliciesModule,
    CouponsModule,
    UserCouponModule,
    FaqsModule,
    ChatModule,
    MailModule
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
