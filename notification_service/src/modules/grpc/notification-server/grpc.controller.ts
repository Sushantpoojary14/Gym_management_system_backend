import { Body, Controller } from '@nestjs/common';
import { GrpcService } from './grpc.service';
import * as notification_1 from 'types/proto/notification';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateNotificationSchema } from 'src/dto/notification.dto';

@Controller()
@notification_1.NotificationServiceControllerMethods()
export class GrpcController {
  constructor(private readonly grpcService: GrpcService) {}

  @GrpcMethod('NotificationService', 'CreateNotification')
  async createNotification(@Body() notification: notification_1.NotificationRequest) {
    const validate =
      await CreateNotificationSchema.safeParseAsync(notification);
    if (!validate.success) {
      throw new Error(validate.error.message);
    }
    return await this.grpcService.createNotification(notification);
  }
}
