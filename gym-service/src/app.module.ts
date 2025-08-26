import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GymsModule } from './gyms/gyms.module';
import { PrismaModule } from './prisma/prisma.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    PrismaModule,
    GymsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
