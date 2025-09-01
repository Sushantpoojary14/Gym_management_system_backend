// push.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PushNotificationService } from '../push-notification.service';

export const PushQueue = 'push-task';
export const pushQueue = new Queue(PushQueue, {
  connection: {
    url: process.env.REDIS_URL,
  },
});
@Processor(PushQueue)
export class PushProcessor extends WorkerHost {
  constructor(private readonly pushService: PushNotificationService) {
    super();
  }

  async process(job: Job) {
    console.log(`Push job - ID: ${job.id}`);
    await this.pushService.sendPushNotification(job.data);
    return { success: true, jobId: job.id };
  }
}
