import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { AwsS3Module } from '../aws-s3/aws-s3.module';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  imports: [AwsS3Module],
  controllers: [KycController],
  providers: [KycService,PrismaService],
  exports: [KycService],
})
export class KycModule {}
