import { IsInt } from 'class-validator';

export class CreateUserCouponDto {
  @IsInt()
  userId: number;

  @IsInt()
  couponId: number;
}
