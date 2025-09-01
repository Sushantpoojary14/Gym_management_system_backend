import {  Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka, Client } from '@nestjs/microservices';

import { KAFKA_TOPICS } from './topics';
import { kafkaConfig } from 'src/config/kafka.config';
import { IntString } from 'src/dto/notification.dto';

@Injectable()
export class NotificationProducerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationProducerService.name);

  @Client(kafkaConfig)
  private client: ClientKafka;

  async onModuleInit() {
    const topics = Object.values(KAFKA_TOPICS);
    topics.forEach(topic => {
      this.client.subscribeToResponseOf(topic);
    });
    await this.client.connect();
  }

  async sendNotification(topic: keyof typeof KAFKA_TOPICS, payload: any) {
    try {
      this.client.emit(topic, payload);
      this.logger.log(`Message sent to topic ${topic}: ${payload.id}`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}`, error);
      throw error;
    }
  }

  async sendRetryNotification(notificationId: IntString, attempt: number) {
    const payload = {
      notificationId,
      attempt,
      timestamp: new Date(),
    };

    this.client.emit(KAFKA_TOPICS.NOTIFICATION_RETRY, payload);
  }
}
