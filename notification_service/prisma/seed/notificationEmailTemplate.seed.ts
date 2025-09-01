import { PrismaClient, Channel, NotificationType, Purpose } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedNotificationEmailTemplates() {
  await prisma.notificationTemplate.createMany({
    data: [
      {
        channel: Channel.email,
        type: NotificationType.payment,
        purpose: Purpose.payment_failed,
        subject: 'Payment Failed - Action Required',
        body: '<p>Dear {{name}}, your payment of {{amount}} failed. Please retry.</p>',
        placeholders: ['{{name}}', '{{amount}}'],
        languageCode: 'en',
      },
      {
        channel: Channel.email,
        type: NotificationType.payment,
        purpose: Purpose.payment_success,
        subject: 'Payment Successful - Thank You',
        body: '<p>Dear {{name}}, your payment of {{amount}} was successful. Thank you!</p>',
        placeholders: ['{{name}}', '{{amount}}'],
        languageCode: 'en',
      },
      {
        channel: Channel.email,
        type: NotificationType.bonus,
        purpose: Purpose.bonus,
        subject: 'Bonus Credited to Your Account',
        body: '<p>Hi {{name}}, a bonus of {{bonus_amount}} has been credited to your account!</p>',
        placeholders: ['{{name}}', '{{bonus_amount}}'],
        languageCode: 'en',
      },
      {
        channel: Channel.email,
        type: NotificationType.security,
        purpose: Purpose.login_alert,
        subject: 'Login Attempt Detected',
        body: '<p>Hi {{name}}, a login attempt was detected on your account from {{location}}.</p>',
        placeholders: ['{{name}}', '{{location}}'],
        languageCode: 'en',
      },
      {
        channel: Channel.email,
        type: NotificationType.security,
        purpose: Purpose.login_success,
        subject: 'Login Successful',
        body: '<p>Hi {{name}}, you successfully logged in from {{location}}.</p>',
        placeholders: ['{{name}}', '{{location}}'],
        languageCode: 'en',
      },
      {
        channel: Channel.email,
        type: NotificationType.reminder,
        purpose: Purpose.reminder,
        subject: 'Friendly Reminder',
        body: '<p>Hi {{name}}, this is a reminder for {{event}} scheduled at {{time}}.</p>',
        placeholders: ['{{name}}', '{{event}}', '{{time}}'],
        languageCode: 'en',
      },
      {
        channel: Channel.email,
        type: NotificationType.system,
        purpose: Purpose.system,
        subject: 'System Notification',
        body: '<p>Hi {{name}}, {{message}}</p>',
        placeholders: ['{{name}}', '{{message}}'],
        languageCode: 'en',
      },
      {
        channel: Channel.email,
        type: NotificationType.default,
        purpose: Purpose.default,
        subject: 'Default Notification',
        body: '<p>{{message}}</p>',
        placeholders: ['{{message}}'],
        languageCode: 'en',
      },
    ],
    skipDuplicates: true, // Avoid inserting duplicates
  });
}


