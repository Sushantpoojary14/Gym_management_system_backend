import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Consumer, ConsumerRunConfig } from 'kafkajs';
import { kafkaClientConfig } from 'src/config/kafka.config';


@Injectable()
export class NotificationConsumerService {
  private readonly logger = new Logger(NotificationConsumerService.name);
  private consumers: Consumer[] = [];
  private kafka: Kafka;
  constructor() {
    this.kafka = new Kafka(kafkaClientConfig);
  }

  async consume(
    groupId: string,
    topic: string,
    config: ConsumerRunConfig,
  ) {
    const consumer = this.kafka.consumer({ groupId });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    this.logger.log(`Subscribed to topic ${topic} with group ${groupId}`);

    await consumer.run(config);

    this.consumers.push(consumer);
  }
}
