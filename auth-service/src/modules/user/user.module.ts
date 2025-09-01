import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UsersService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AwsS3Module } from '../aws-s3/aws-s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]),AwsS3Module],
  controllers: [UserController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserModule {}
