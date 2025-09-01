import { forwardRef, Module } from '@nestjs/common';
import { CouponService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { CouponEventListener } from './coupon.events';
import { UserCouponModule } from '../user-coupon/user-coupon.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon]),forwardRef(() => UserCouponModule)],
  controllers: [CouponsController,CouponEventListener],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponsModule {}
