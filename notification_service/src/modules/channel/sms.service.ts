import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Channel } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from 'src/database/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}
  async sendSms(notification: any) {
    let phone = notification.metadata?.phone;

    const user = await this.authService.getUser(notification.userId);
    if (!phone) {
      phone = user?.phone;
      if (!phone) throw new Error('Phone not found');
    }

    // Fetch template for SMS
    const template = await this.prisma.notificationTemplate.findUnique({
      where: {
        channel_type_purpose: {
          channel: Channel.sms,
          type: notification.type,
          purpose: notification.purpose,
        },
      },
    });

    if (!template) {
      throw new BadRequestException('Notification template not found');
    }

    // Replace placeholders (assuming sms.placeholders is array like ["name","otp"])
    const variablesValues = this.replacePlaceholders(
      { ...user, ...notification.metadata },
      template.placeholders,
    );

    // Build SMS request body
    const body = {
      sender_id: process.env.FAST2SMS_SENDER_ID,
      message: template.messageID,
      variables_values: variablesValues,
      route: 'dlt',
      numbers: phone,
    };

    // Call Fast2SMS API
    await firstValueFrom(
      this.httpService.post('https://www.fast2sms.com/dev/bulkV2', body, {
        headers: { Authorization: process.env.FAST2SMS_API_KEY },
      }),
    );

    this.logger.log(`SMS sent successfully to ${phone}`);

    return { messageId: `sms-${Date.now()}` };
  }

  replacePlaceholders(metadata: Record<string, any>, placeholders: string[]) {
    let str = '';
    if (!metadata || !placeholders?.length) return str;
    Object.entries(metadata).forEach(([key, value]) => {
      if (placeholders.includes(key)) {
        str += `${value} `;
      }
    });
    return str.trim().replace(' ', '|');
  }
}
