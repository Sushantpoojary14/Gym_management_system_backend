// email.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EmailService } from '../email.service';

export const EmailQueue = 'email-task';
export const emailQueue = new Queue(EmailQueue, {
  connection: {
    url: process.env.REDIS_URL,
  },
});
@Processor(EmailQueue)
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job) {
    console.log(`Email job - ID: ${job.id}`);
    await this.emailService.sendEmail(job.data);
    return { success: true, jobId: job.id };
  }
}
