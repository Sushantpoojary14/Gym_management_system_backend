import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/common/jwt/jwt.strategy';
import { AwsS3Module } from '../aws-s3/aws-s3.module';

import { PrismaService } from 'src/database/prisma.service';
import { SessionService } from './session.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AwsS3Module,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService,SessionService],
  exports: [AuthService],
})
export class AuthModule {}
