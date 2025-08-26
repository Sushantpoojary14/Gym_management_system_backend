import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
