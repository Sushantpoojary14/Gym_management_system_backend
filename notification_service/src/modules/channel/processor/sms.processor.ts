// sms.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { SmsService } from '../sms.service';
export const SmsQueue = 'sms-task';
export const smsQueue = new Queue(SmsQueue, {
  connection: {
    url: process.env.REDIS_URL,
  },
});
@Processor(SmsQueue)
export class SmsProcessor extends WorkerHost {
  constructor(private readonly smsService: SmsService) {
    super();
  }

  async process(job: Job) {
    console.log(`SMS job - ID: ${job.id}`);
    await this.smsService.sendSms(job.data);
    return { success: true, jobId: job.id };
  }
}
