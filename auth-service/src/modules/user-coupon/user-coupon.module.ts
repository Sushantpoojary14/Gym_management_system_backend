import { forwardRef, Module } from '@nestjs/common';
import { UserCouponService } from './user-coupon.service';
import { UserCouponController } from './user-coupon.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCoupon } from './entities/user-coupon.entity';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserCoupon]),forwardRef(() => CouponsModule)],
  controllers: [UserCouponController],
  providers: [UserCouponService],
  exports: [UserCouponService],
})
export class UserCouponModule {}
