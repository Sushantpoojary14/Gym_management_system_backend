import { Injectable } from '@nestjs/common';
import { NotificationRequest } from 'types/proto/notification';

import { CreateNotificationSchema } from 'src/dto/notification.dto';
import { NotificationService } from 'src/modules/notification/notification.service';

@Injectable()
export class GrpcService {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  async createNotification(notification: NotificationRequest) {
    
    const validate =
      await CreateNotificationSchema.safeParseAsync(notification);
    if (!validate.success) {
      throw new Error(validate.error.message);
    }
    const notificationData = {
      title: validate.data.title,
      message: validate.data.message,
      priority: validate.data.priority,
      scheduledAt: validate.data.scheduledAt,
      metadata: validate.data.metadata,
      userId: validate.data.userId,
      type: validate.data.type,
      purpose: validate.data.purpose,
      referenceId: validate.data.referenceId,
      ...(validate.data.referenceType
        ? { referenceType: validate.data.referenceType.toString() }
        : {}),
      channels: validate.data.channels,
    };
   
    await this.notificationService.createNotification(notificationData);
    return { success: true, message: 'Notification created successfully' };
  }
}
