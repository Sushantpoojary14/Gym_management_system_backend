import { Module } from '@nestjs/common';
import { RabbitMQModule as NestRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [
    NestRabbitMQModule.forRootAsync(NestRabbitMQModule, {
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'auth.exchange',
            type: 'topic',
          },
        ],
        uri: configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
        connectionInitOptions: { timeout: 10000 },
        enableControllerDiscovery: true,
        defaultRpcTimeout: 5000,
        defaultRpcErrorHandler: (channel: any, msg: any, error: Error) => {
          console.error('RabbitMQ RPC Error:', error);
          channel.reject(msg, false);
        },
      }),
      inject: [ConfigService],
    }) ,
  ],
  providers: [RabbitMQService],
  exports: [NestRabbitMQModule, RabbitMQService],
})
export class RabbitMQModule {}
