import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { AuthEventPatterns } from '../rabbitmq/interfaces/rmq-event.interface';

@Injectable()
export class EventsService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async emitUserRegistered(user: any): Promise<void> {
    await this.rabbitMQService.publishEvent(
      AuthEventPatterns.USER_REGISTERED,
      {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    );
  }

  async emitUserLoggedIn(user: any, ipAddress: string, userAgent: string): Promise<void> {
    await this.rabbitMQService.publishEvent(
      AuthEventPatterns.USER_LOGGED_IN,
      {
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      },
    );
  }

  async emitUserLoggedOut(userId: string, tokenId: string): Promise<void> {
    await this.rabbitMQService.publishEvent(
      AuthEventPatterns.USER_LOGGED_OUT,
      {
        userId,
        tokenId,
        timestamp: new Date().toISOString(),
      },
    );
  }

  async emitPasswordChanged(userId: string): Promise<void> {
    await this.rabbitMQService.publishEvent(
      AuthEventPatterns.USER_PASSWORD_CHANGED,
      {
        userId,
        timestamp: new Date().toISOString(),
      },
    );
  }

  async emitProfileUpdated(user: any): Promise<void> {
    await this.rabbitMQService.publishEvent(
      AuthEventPatterns.USER_PROFILE_UPDATED,
      {
        userId: user.id,
        email: user.email,
        updatedFields: {
          firstName: user.firstName,
          lastName: user.lastName,
          // Add other updateable fields here
        },
      },
    );
  }
}
