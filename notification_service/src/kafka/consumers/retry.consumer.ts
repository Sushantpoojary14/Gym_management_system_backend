import { Injectable } from '@nestjs/common';
import { NotificationProcessorService } from 'src/modules/notification/notification-processor.service';
import { KAFKA_TOPICS } from '../topics';
import { OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { NotificationConsumerService } from '../notification-consumer.service';
import {
  intStringSchema,
} from 'src/dto/notification.dto';
import z from 'zod';
import { NotificationService } from 'src/modules/notification/notification.service';

@Injectable()
export class RetryConsumer implements OnModuleInit {
  constructor(
    private readonly processor: NotificationProcessorService,
    private readonly consumerService: NotificationConsumerService,
    private readonly notificationService: NotificationService,
  ) {}
  private readonly logger = new Logger(RetryConsumer.name);
  async onModuleInit() {
    void this.runConsumerLoop();
  }
  async runConsumerLoop() {
    await this.consumerService.consume(
      'retry-consumer',
      KAFKA_TOPICS.NOTIFICATION_RETRY,
      {
        eachMessage: async ({ topic, partition, message }) => {
          const payload = JSON.parse(message.value?.toString() || '');
          this.logger.log(
            `Received message from topic ${topic} partition ${partition} message ${message.value}`,
          );
          const result = z
            .object({
              notificationId: intStringSchema,
              attempt: z.number(),
              timestamp: z.preprocess((value: unknown) => {
                if (value === null || value === undefined) {
                  return new Date();
                }
                return new Date(String(value));
              }, z.date()),
            })
            .safeParse(payload);

          if (!result.success) {
            this.logger.error(`Invalid message format: ${message.value} `);
            return;
          }
          const notification = result.data;
          console.log(notification);
          
          this.logger.log(`Processing notification retry: ${notification.notificationId}`);
          const notificationData = await this.notificationService.getNotificationById(
            notification.notificationId,
          );
          if (!notificationData) {
            this.logger.error(
              `Notification ${notification.notificationId} not found`,
            );
            return;
          }
          await this.processor.processNotification(notificationData);
        },
      },
    );
  }
}
