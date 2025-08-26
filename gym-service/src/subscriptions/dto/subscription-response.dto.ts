import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Unique identifier of the subscription' })
  id: string;

  @ApiProperty({ description: 'User ID this subscription belongs to' })
  userId: string;

  @ApiProperty({ description: 'Gym ID this subscription is for' })
  gymId: string;

  @ApiProperty({ description: 'Membership plan ID for this subscription' })
  membershipPlanId: string;

  @ApiProperty({ type: Date, description: 'Start date of the subscription' })
  startDate: Date;

  @ApiProperty({ type: Date, description: 'End date of the subscription' })
  endDate: Date;

  @ApiProperty({ enum: SubscriptionStatus, enumName: 'SubscriptionStatus' })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Whether the subscription will auto-renew' })
  autoRenew: boolean;

  @ApiProperty({ required: false, description: 'Number of sessions allowed (for session-based plans)' })
  sessionsAllowed?: number;

  @ApiProperty({ default: 0, description: 'Number of sessions used' })
  sessionsUsed: number;

  @ApiProperty({ required: false, description: 'Additional notes about the subscription' })
  notes?: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
