import { Eureka } from 'eureka-js-client';
import { ConfigService } from '@nestjs/config';

export const getEurekaClient = (configService: ConfigService) => {
  return new Eureka({
    instance: {
      app: 'auth-service',
      instanceId: `${configService.get('SERVICE_NAME')}:${configService.get('PORT')}`,
      hostName: configService.get('EUREKA_INSTANCE_HOSTNAME') || 'localhost',
      ipAddr: '127.0.0.1',
      port: {
        '$': configService.get<number>('PORT'),
        '@enabled': 'true',
      },
      vipAddress: configService.get('SERVICE_NAME') || 'FANTASY-CRICKET-AUTH-SERVICE',
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
      registerWithEureka: true,
      fetchRegistry: true,
    },
    eureka: {
    
      host: configService.get('EUREKA_SERVER_HOST') || 'localhost',
      port: configService.get('EUREKA_SERVER_PORT') || 8766,
      servicePath: '/eureka/apps/',
      maxRetries: 10,
      requestRetryDelay: 2000,
    },
  });
};
