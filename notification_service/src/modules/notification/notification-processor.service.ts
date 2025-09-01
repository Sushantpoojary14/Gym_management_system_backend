import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationProducerService } from 'src/kafka/notification-producer.service';

import { Channel, NotificationStatus } from '@prisma/client';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { EmailQueue } from '../channel/processor/mail.processor';
import { SmsQueue } from '../channel/processor/sms.processor';
import { PushQueue } from '../channel/processor/push.processor';

@Injectable()
export class NotificationProcessorService {
  private readonly logger = new Logger(NotificationProcessorService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly producer: NotificationProducerService,

    @InjectQueue(EmailQueue) private emailQueue: Queue<any, any>,
    @InjectQueue(SmsQueue) private smsQueue: Queue<any, any>,
    @InjectQueue(PushQueue) private pushQueue: Queue<any, any>,
  ) {}

  async processNotification(notification: any) {
    try {
      this.logger.log(`Processing notification: ${notification}`);
      if (!notification) {
        this.logger.error(`Notification not found`);
        return;
      }
      const results = await Promise.allSettled(
        notification.channels?.map((channel: Channel) =>
          this.sendByChannel(channel, notification),
        ),
      );

      const failures = results.filter((result) => result.status === 'rejected');

      if (failures.length === 0) {
        await this.notificationService.updateNotificationStatus(
          notification?.id,
          NotificationStatus.sent,
        );
        this.logger.log(`Notification sent successfully: ${notification?.id}`);
      } else {
        this.logger.log(
          `Notification failed: ${notification?.id} ${JSON.stringify(failures)}`,
        );
        if (notification) {
          await this.handleFailure(notification, failures);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to process notification: ${notification?.id}`,
        error,
      );
      if (notification) {
        await this.handleFailure(notification, [{ reason: error.message }]);
      }
    }
  }
  private async sendByChannel(channel: Channel, notification: any) {
    this.logger.log(`Queueing notification for ${channel}: ${notification.id}`);

    const priorityMap = {
      low: 4,
      medium: 3,
      high: 2,
      critical: 1,
    };

    const jobPriority = priorityMap[notification.priority] ?? 3; // default: medium
    switch (channel) {
      case 'email':
        await this.emailQueue.add(channel, notification, {
          priority: jobPriority,
        });
        break;
      case 'sms':
        await this.smsQueue.add(channel, notification, {
          priority: jobPriority,
        });
        break;
      case 'push':
        await this.pushQueue.add(channel, notification, {
          priority: jobPriority,
        });
        break;
    }
  }

  private async handleFailure(notification: any, failures: any[]) {
    await this.notificationService.incrementRetryCount(notification?.id);

    const updatedNotification =
      await this.notificationService.getNotificationsByUser(
        notification.userId,
        notification.status,
      );
    for (const notification of updatedNotification) {
      if (notification.retryCount < notification.maxRetries) {
        // Schedule retry with exponential backoff
        const delay = Math.pow(2, notification.retryCount) * 1000;

        setTimeout(async () => {
          await this.producer.sendRetryNotification(
            notification.id,
            notification.retryCount + 1,
          );
        }, delay);

        this.logger.log(
          `Notification ${notification.id} scheduled for retry in ${delay}ms`,
        );
      } else {
        await this.notificationService.updateNotificationStatus(
          notification.id,
          NotificationStatus.failed,
          failures.map((f) => f.reason).join('; '),
        );
        this.logger.error(`Notification ${notification.id} failed permanently`);
      }
    }
  }
}
