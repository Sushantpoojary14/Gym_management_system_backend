import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CouponService } from './coupons.service';
import { UserCouponService } from '../user-coupon/user-coupon.service';
import { CouponAction } from 'src/common/enums/couponAction.enum';

@Controller()
export class CouponEventListener {
  constructor(
    private readonly couponService: CouponService,
    private readonly userCouponService: UserCouponService
  ) {}

  @EventPattern('user.first_deposit')
  async handleFirstDeposit(@Payload() data: { userId: number }) {
    const coupons = await this.couponService.findByAction(CouponAction.FIRST_DEPOSIT);

    for (const coupon of coupons) {
      await this.userCouponService.assignCoupon({
        userId: data.userId,
        couponId: coupon.id,
      });
    }
  }

  @EventPattern('user.joined_first_contest')
  async handleFirstContest(@Payload() data: { userId: number }) {
    const coupons = await this.couponService.findByAction(CouponAction.FIRST_CONTEST);

    for (const coupon of coupons) {
      await this.userCouponService.assignCoupon({
        userId: data.userId,
        couponId: coupon.id,
      });
    }
  }

  @EventPattern('user.promotion')
  async handlePromotion(@Payload() data: { userId: number }) {
    const coupons = await this.couponService.findByAction(CouponAction.PROMOTIONAL);
    for(const coupon of coupons){
      await this.userCouponService.assignCoupon({
        userId:data.userId,
        couponId:coupon.id,
      })
    }
  }
}
