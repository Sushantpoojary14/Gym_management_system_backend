import { Module } from '@nestjs/common';
import { GrpcService } from './grpc.service';
import { GrpcController } from './grpc.controller';
import { PrismaService } from 'src/database/prisma.service';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { HttpController } from './http.controller';
@Module({
  imports: [NotificationModule],
  providers: [GrpcService, PrismaService],
  controllers: [GrpcController,HttpController],
})
export class GrpcModule {}
