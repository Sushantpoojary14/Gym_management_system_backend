import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import type { RmqEvent } from './interfaces/rmq-event.interface';
import type { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  onModuleInit() {
    console.log('RabbitMQ Service initialized');
  }

  @RabbitRPC({
    exchange: 'auth.exchange',
    routingKey: 'auth.*',
    queue: 'auth_queue',
    queueOptions: {
      durable: true,
    },
  })
  public async handleEvent(event: RmqEvent): Promise<void> {
    try {
      console.log('Received event:', event);
      // Handle different event types here
      switch (event.pattern) {
        case 'auth.user.registered':
          // Handle user registered event
          await this.handleUserRegistered(event.data);
          break;
        case 'auth.user.logged_in':
          // Handle user logged in event
          await this.handleUserLoggedIn(event.data);
          break;
        default:
          console.warn('Unknown event pattern:', event.pattern);
      }
    } catch (error) {
      console.error('Error handling RabbitMQ event:', error);
      throw error;
    }
  }

  private async handleUserRegistered(data: any): Promise<void> {
    console.log('Handling user registered event:', data);
    // Add your user registration event handling logic here
  }

  private async handleUserLoggedIn(data: any): Promise<void> {
    console.log('Handling user logged in event:', data);
    // Add your user login event handling logic here
  }

  public async publishEvent<T>(
    routingKey: string,
    data: T,
    exchange = 'auth.exchange',
  ): Promise<void> {
    try {
      const event: RmqEvent = {
        pattern: routingKey,
        data,
        timestamp: new Date().toISOString(),
      };

      console.log(`Publishing event to ${exchange} with routing key ${routingKey}`);
      await this.amqpConnection.publish(exchange, routingKey, event);
    } catch (error) {
      console.error('Error publishing RabbitMQ event:', error);
      throw error;
    }
  }
}

