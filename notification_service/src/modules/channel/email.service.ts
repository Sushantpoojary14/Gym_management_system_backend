import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Channel,  Purpose } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { AuthService } from '../auth/auth.service';

interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}
  async sendEmail(notification: any) {
   
    
    let email = notification.metadata?.email;
  
    const user = await this.authService.getUser(notification.userId);
    if (!email) {
      email = user?.email;
      if (!email) throw new Error('Email not found');
    }
  
    // Try fetching template based on type/purpose
    let template = await this.prisma.notificationTemplate.findUnique({
      where: {
        channel_type_purpose: {
          channel: Channel.email,
          type: notification.type,
          purpose: notification.purpose,
        },
      },
    });
  
    // If no custom template → fallback to default
    if (!template) {
      template = await this.prisma.notificationTemplate.findUnique({
        where: {
          channel_type_purpose: {
            channel: Channel.email,
            type: notification.type,
            purpose: Purpose.default,
          },
        },
      });
      if (!template) throw new Error('No template or default template found');
    }
  
    // Prepare subject/body with placeholders
    const subject = replacePlaceholders(template.subject ?? notification.title, {
      ...user,
      ...notification.metadata,
      message: notification.message,
    });
  
    const body = replacePlaceholders(template.body ?? '', {
      ...user,
      ...notification.metadata,
      message: notification.message,
    });
  
    const dto: SendEmailDto = {
      to: email,
      subject,
      body,
      metadata: notification.metadata,
    };
  
    // Send email
    await this.mailerService.sendMail({
      to: dto.to,
      subject: dto.subject,
      html: dto.body,
      template: 'notification',
      context: dto,
    });
  
    this.logger.log(`Email sent successfully to ${email}`);
  
    return { messageId: `email-${Date.now()}` };
  }
  
}
function replacePlaceholders(str: string, metadata: Record<string, any>) {
  return str.replace(/{{(.*?)}}/g, (_, key) => {
    const trimmedKey = key.trim();
    return metadata[trimmedKey] ?? '';
  });
}
