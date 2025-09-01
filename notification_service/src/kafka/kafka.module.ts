import { Module } from '@nestjs/common';
import { NotificationConsumerService } from './notification-consumer.service';
import { NotificationProducerService } from './notification-producer.service';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { PrismaService } from 'src/database/prisma.service';
import { RetryConsumer } from './consumers/retry.consumer';
import { PriorityConsumer } from './consumers/priority.consumer';

@Module({
  imports: [NotificationModule],
  providers: [
    NotificationConsumerService,
    NotificationProducerService,
    PrismaService,
    RetryConsumer,
    PriorityConsumer,
  ],
  exports: [NotificationProducerService],
})
export class KafkaModule {}
