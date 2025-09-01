import { IsNotEmpty, IsEnum, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { CouponType } from 'src/common/enums/CouponType.enum';
import { CouponAction } from 'src/common/enums/couponAction.enum';

export class CreateCouponDto {

  @IsEnum(CouponType)
  type: CouponType;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsDateString()
  validTill: Date;

  @IsOptional()
  @IsNumber()
  redemtionLimit?: number;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsEnum(CouponAction)
  triggerAction?: CouponAction;

  @IsOptional()
  @IsBoolean()
  autoAssign?: boolean;
}
