import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PushNotificationService } from './push-notification.service';
import { MailerModule } from '@nestjs-modules/mailer';

import { PrismaService } from 'src/database/prisma.service';
import { HttpModule } from '@nestjs/axios';

import { EmailProcessor } from '../channel/processor/mail.processor';
import { SmsProcessor } from '../channel/processor/sms.processor';
import { PushProcessor } from '../channel/processor/push.processor';
import { AuthModule } from '../auth/auth.module';
import { NotificationSchedule } from './notification.schedule';

@Module({
  imports: [
    HttpModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
    }),
    AuthModule,
  ],
  providers: [
    EmailService,
    SmsService,
    PushNotificationService,
    PrismaService,
    EmailProcessor,
    SmsProcessor,
    PushProcessor,
    NotificationSchedule,
  ],
  exports: [EmailService, SmsService, PushNotificationService],
})
export class ChannelModule {}
