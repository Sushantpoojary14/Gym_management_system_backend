import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationProcessorService } from 'src/modules/notification/notification-processor.service';

import { AuthModule } from '../auth/auth.module';
import { PrismaService } from 'src/database/prisma.service';
import { HttpModule } from '@nestjs/axios';

import { NotificationProducerService } from 'src/kafka/notification-producer.service';
import { BullModule } from '@nestjs/bullmq';
import { EmailQueue } from '../channel/processor/mail.processor';
import { SmsQueue } from '../channel/processor/sms.processor';
import { PushQueue } from '../channel/processor/push.processor';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    HttpModule,
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    BullModule.registerQueue({
      name: EmailQueue,
      defaultJobOptions: {
        attempts: 2,
        delay: 500,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: SmsQueue,
      defaultJobOptions: {
        attempts: 2,
        delay: 500,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: PushQueue,
      defaultJobOptions: {
        delay: 500,
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: false,

      },
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    PrismaService,
    NotificationProcessorService,
    NotificationProducerService,


  ],
  exports: [NotificationService, NotificationProcessorService],
})
export class NotificationModule {}
