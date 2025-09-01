import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kyc } from './entities/kyc.entity';
import { AwsS3Module } from '../aws-s3/aws-s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([Kyc]),AwsS3Module],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
