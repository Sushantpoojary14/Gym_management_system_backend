import { Injectable, Logger } from '@nestjs/common';

import { NotificationProducerService } from 'src/kafka/notification-producer.service';

import { PrismaService } from 'src/database/prisma.service';

import { KAFKA_TOPICS } from 'src/kafka/topics';
import {
  CreateNotificationDto,
  IntString,
  NotificationPayload,
} from 'src/dto/notification.dto';
import { NotificationStatus, Priority } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly producer: NotificationProducerService,
  ) {}
  async saveToken(userId: IntString, token: string, device?: string) {
    return this.prisma.fcmToken.upsert({
      where: { token },
      update: { userId, device },
      create: { userId, token, device },
    });
  }

  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        ...dto,
        status: NotificationStatus.pending,
      },
    });

    this.logger.log(`Notification created: ${notification.id}`);

    // Send to appropriate priority queue if not scheduled for future
    if (!dto.scheduledAt || dto.scheduledAt <= new Date()) {
      await this.queueNotification(notification);
    }

    return notification;
  }

  async queueNotification(notification: NotificationPayload) {
    const topic = this.getPriorityTopic(notification.priority);

    const payload = {
      id: notification.id,
      purpose: notification.purpose,
      userId: notification.userId,
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      referenceId: notification.referenceId,
      referenceType: notification.referenceType,
      channels: notification.channels,
      createdAt: notification.createdAt,
    };

    await this.producer.sendNotification(topic, payload);

    // Update status to processing
    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { status: NotificationStatus.processing },
    });

    this.logger.log(`Notification queued: ${notification.id} to ${topic}`);
  }

  private getPriorityTopic(priority: Priority): string {
    switch (priority) {
      case Priority.critical:
        return KAFKA_TOPICS.NOTIFICATION_PRIORITY_CRITICAL;
      case Priority.high:
        return KAFKA_TOPICS.NOTIFICATION_PRIORITY_HIGH;
      case Priority.medium:
        return KAFKA_TOPICS.NOTIFICATION_PRIORITY_MEDIUM;
      case Priority.low:
      default:
        return KAFKA_TOPICS.NOTIFICATION_PRIORITY_LOW;
    }
  }
  async getNotificationsByUser(userId: IntString, status?: NotificationStatus) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getNotificationById(id: IntString) {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async markAsRead(notificationId: IntString, userId: IntString) {
    return this.prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        metadata: {
          readAt: new Date(),
        },
      },
    });
  }

  async updateNotificationStatus(
    notificationId: IntString,
    status: NotificationStatus,
    failureReason?: string,
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === NotificationStatus.sent) {
      updateData.sentAt = new Date();
    }

    if (failureReason) {
      updateData.failureReason = failureReason;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: updateData,
    });
  }

  async incrementRetryCount(notificationId: IntString) {
    this.logger.log(
      `Incrementing retry count for notification ${notificationId}`,
    );
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        retryCount: {
          increment: 1,
        },
      },
    });
  }

  async getScheduledNotifications() {
    return this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.pending,
        scheduledAt: {
          lte: new Date(),
        },
      },
    });
  }
}
