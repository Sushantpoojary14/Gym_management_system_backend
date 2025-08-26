import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  gymId: string;

  @IsUUID()
  @IsNotEmpty()
  membershipPlanId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus = SubscriptionStatus.PENDING;

  @IsOptional()
  autoRenew?: boolean = true;

  @IsOptional()
  @Min(0)
  sessionsAllowed?: number;

  @IsOptional()
  @Min(0)
  sessionsUsed?: number = 0;

  @IsOptional()
  notes?: string;
}
