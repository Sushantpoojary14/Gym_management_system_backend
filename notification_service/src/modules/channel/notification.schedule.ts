import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { pushQueue } from './processor/push.processor';
import { smsQueue } from './processor/sms.processor';
import { emailQueue } from './processor/mail.processor';

@Injectable()
export class NotificationSchedule {
  private readonly logger = new Logger(NotificationSchedule.name);
  private readonly queues = [emailQueue, smsQueue, pushQueue];

  // Retry failed jobs
  private async retryFailedJobs() {
    for (const queue of this.queues) {
      const failedJobs = await queue.getFailed();
      for (const job of failedJobs) {
        try {
          await job.retry();
          this.logger.log(`[${queue.name}] Retried failed job ${job.id}`);
        } catch (err) {
          this.logger.error(
            `[${queue.name}] Failed to retry job ${job.id}: ${err.message}`,
          );
        }
      }
    }
  }

  // Requeue stuck waiting jobs (if server crash or not picked up)
  private async recoverWaitingJobs() {
    for (const queue of this.queues) {
      const waitingJobs = await queue.getWaiting();
      for (const job of waitingJobs) {
        try {
          await queue.add(job.name, job.data, {
            priority: job.opts.priority ?? 3,
          });
          await job.remove(); // remove old reference
          this.logger.log(`[${queue.name}] Re-queued stuck job ${job.id}`);
        } catch (err) {
          this.logger.error(
            `[${queue.name}] Failed to re-queue job ${job.id}: ${err.message}`,
          );
        }
      }
    }
  }

  // Cleanup old jobs
  private async cleanJobs() {
    for (const queue of this.queues) {
      const removedFailed = await queue.clean(60 * 60 * 1000, 1000, 'failed'); // older than 1h
      const removedCompleted = await queue.clean(60 * 60 * 1000, 1000, 'completed'); // older than 1h
      this.logger.log(
        `[${queue.name}] Cleaned ${removedFailed.length} failed, ${removedCompleted.length} completed jobs`,
      );
    }
  }

  // Run every 5 minutes
  @Cron('*/10 * * * *')
  async schedule() {
    this.logger.log('🔄 Cron started: Checking jobs...');
    await this.retryFailedJobs();
    await this.recoverWaitingJobs();
    await this.cleanJobs();
    this.logger.log('✅ Cron finished.');
  }
}
