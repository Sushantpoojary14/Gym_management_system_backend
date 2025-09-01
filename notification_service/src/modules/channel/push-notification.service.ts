import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from 'src/database/prisma.service';

export interface ISendFirebaseMessages {
  token: string;
  title?: string;
  message: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private readonly prisma: PrismaService) {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async sendPushNotification(data: any) {
    const fcmTokens = await this.prisma.fcmToken.findMany({
      where: { userId: data.userId },
    });
    if (fcmTokens.length === 0) {
      console.log('No FCM tokens found for user');
      return;
    }
    const tokens = fcmTokens.map((t) => t.token);

    const payload: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: data.title,
        body: data.message,
      },
      data: {
        customKey: JSON.stringify(data.metadata ?? {}),
      },
    };

    const response = await admin.messaging().sendEachForMulticast(payload);

    console.log('Push Notification sent!');
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        this.prisma.fcmToken.delete({
          where: { token: payload.tokens[idx] },
        });
        console.error('Failed token:', payload.tokens[idx], res.error?.message);
        // You can delete the invalid token from DB if needed
      }
    });
    return;
  }
}
