import { Injectable } from '@nestjs/common';
import { NotificationProcessorService } from 'src/modules/notification/notification-processor.service';
import { KAFKA_TOPICS } from '../topics';
import { OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { NotificationConsumerService } from '../notification-consumer.service';
import { CreateNotificationSchema } from 'src/dto/notification.dto';
import z from 'zod';

@Injectable()
export class PriorityConsumer implements OnModuleInit {
  constructor(
    private readonly processor: NotificationProcessorService,
    private readonly consumerService: NotificationConsumerService,
  ) {}
  private readonly logger = new Logger(PriorityConsumer.name);
  async onModuleInit() {
    await this.createPriorityConsumer(
      'critical-consumer',
      KAFKA_TOPICS.NOTIFICATION_PRIORITY_CRITICAL,
    );
    await this.createPriorityConsumer(
      'high-consumer',
      KAFKA_TOPICS.NOTIFICATION_PRIORITY_HIGH,
    );
    await this.createPriorityConsumer(
      'medium-consumer',
      KAFKA_TOPICS.NOTIFICATION_PRIORITY_MEDIUM,
    );
    await this.createPriorityConsumer(
      'low-consumer',
      KAFKA_TOPICS.NOTIFICATION_PRIORITY_LOW,
    );
  }
  async createPriorityConsumer(groupId: string, topic: string) {
    await this.consumerService.consume(groupId, topic, {
      eachMessage: async ({ topic, partition, message }) => {
        const payload = JSON.parse(message.value?.toString() || '');
        this.logger.log(
          `Received message from topic ${topic} partition ${partition} message ${message.value}`,
        );
        const result = CreateNotificationSchema.catchall(z.any()).safeParse(
          payload,
        );

        if (!result.success) {
          this.logger.error(`Invalid message format: ${result.error.message} `);
          return;
        }
        const notification = result.data;
        await this.processor.processNotification(notification);
      },
    });
  }
}
