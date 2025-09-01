import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from './entities/policy.entity';
import { PolicySection } from './entities/policySection.entity';
import { AwsS3Module } from '../aws-s3/aws-s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([Policy,PolicySection]),AwsS3Module],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService]
})
export class PoliciesModule {}
