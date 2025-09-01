import { Module, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getEurekaClient } from './eureka.config';
import { Eureka } from 'eureka-js-client';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'EUREKA_CLIENT',
      useFactory: (configService: ConfigService) => {
        return getEurekaClient(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['EUREKA_CLIENT'],
})
export class EurekaModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly configService: ConfigService,
    @Inject('EUREKA_CLIENT') private readonly eurekaClient: Eureka,
  ) {}

  onModuleInit() {
    this.eurekaClient.start((error) => {
      if (error) {
        console.error('Eureka registration failed:', error);
      } else {
        console.log('Eureka client started and registered');
      }
    });
  }

  onModuleDestroy() {
    this.eurekaClient.stop();
  }
}
