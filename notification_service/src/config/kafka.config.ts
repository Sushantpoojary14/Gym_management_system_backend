import { KafkaOptions, Transport } from "@nestjs/microservices";
import { logLevel } from "kafkajs";

// In kafka.config.ts
export const kafkaClientConfig = {
  clientId: 'fantansy-app',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  connectionTimeout: 3000,
  requestTimeout: 25000,
  logLevel: process.env.NODE_ENV === 'production' ? logLevel.WARN : logLevel.INFO,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
};

export const kafkaConfig: KafkaOptions = {
  transport: Transport.KAFKA,
  options: {
    client: kafkaClientConfig,
    consumer: {
      groupId: process.env.KAFKA_CONSUMER_GROUP || 'notification-consumer-group',
      allowAutoTopicCreation: true,
    },

  },
};