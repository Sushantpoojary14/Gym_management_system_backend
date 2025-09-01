import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

import * as notificationDto from 'src/dto/notification.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/auth.decorator';
import { RoleEnum } from '../auth/role.enum';

import { NotificationStatus } from '@prisma/client';
import { ZodValidationPipe } from 'pipe/zodValidation.pipe';
import z from 'zod';

@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Roles([RoleEnum.SUPER_ADMIN])
  async createNotification(
    @Body(new ZodValidationPipe(notificationDto.CreateNotificationSchema))
    dto: notificationDto.CreateNotificationDto,
  ) {
    return this.notificationService.createNotification(dto);
  }

  @Roles([RoleEnum.USER])
  @Post('save-token')
  async saveToken(
    @Body(
      new ZodValidationPipe(
        z.object({
          userId: notificationDto.intStringSchema,
          token: z.string().transform((val) => val.trim()),
          device: z
            .string()
            .optional()
            .transform((val) => val?.trim()),
        }),
      ),
    )
    dto: {
      userId: notificationDto.IntString;
      token: string;
      device?: string;
    },
  ) {
    return this.notificationService.saveToken(
      dto.userId,
      dto.token,
      dto.device,
    );
  }

  @Get('user/:userId')
  @Roles([RoleEnum.USER])
  async getUserNotifications(
    @Param('userId', new ZodValidationPipe(notificationDto.intStringSchema))
    userId: notificationDto.IntString,
    @Query('status') status?: NotificationStatus,
  ) {
    return this.notificationService.getNotificationsByUser(userId, status);
  }

  @Patch(':id/read')
  @Roles([RoleEnum.USER])
  async markAsRead(
    @Param('id', new ZodValidationPipe(notificationDto.intStringSchema))
    id: notificationDto.IntString,
    @Body('userId', new ZodValidationPipe(notificationDto.intStringSchema))
    userId: notificationDto.IntString,
  ) {
    return this.notificationService.markAsRead(id, userId);
  }
}
