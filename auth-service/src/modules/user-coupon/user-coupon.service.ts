import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCoupon } from './entities/user-coupon.entity';
import { User } from '../user/entities/user.entity';
import { CreateUserCouponDto } from './dto/create-user-coupon.dto';
import { CouponService } from '../coupons/coupons.service';
import { Coupon } from '../coupons/entities/coupon.entity';

@Injectable()
export class UserCouponService {
  constructor(
    @InjectRepository(UserCoupon)
    private readonly userCouponRepo: Repository<UserCoupon>,

    private readonly couponService: CouponService,
  ) { }

  async assignCoupon(createDto: CreateUserCouponDto) {
    const { userId, couponId } = createDto;

    const coupon = await this.couponService.findOne(couponId);
    if (!coupon) throw new NotFoundException('Coupon not found');

    if (new Date(coupon.validTill) < new Date()) {
      throw new BadRequestException('Coupon expired');
    }

    const existing = await this.userCouponRepo.findOne({
      where: { user: { id: userId }, coupon: { id: couponId } },
    });

    if (existing) throw new ConflictException('Coupon already assigned');

    const userCoupon = this.userCouponRepo.create({
      user: { id: userId } as User,
      coupon,
    });

    return this.userCouponRepo.save(userCoupon);
  }

  async redeemCoupon(userId: number, couponCode: string, amount: number) {
    const userCoupon = await this.userCouponRepo.findOne({
      where: { user: { id: userId }, coupon: { couponCode } },
      relations: ['coupon'],
    });

    if (!userCoupon) throw new NotFoundException('Coupon not found');
    if (userCoupon.coupon.validTill < new Date())
      throw new BadRequestException('Coupon expired');

    if (userCoupon.redeemedCount >= userCoupon.coupon.redemtionLimit) {
      throw new BadRequestException('Redemption limit reached');
    }

    const { discount, finalAmount } = this.calculateDiscount(
      amount,
      userCoupon.coupon,
    );

    userCoupon.redeemedCount += 1;
    userCoupon.isRedeemed = true;
    userCoupon.redeemedAt = new Date();
    await this.userCouponRepo.save(userCoupon);

    return {
      originalAmount: amount,
      discount,
      finalAmount,
      couponCode,
    };
  }

  async getUserCoupons(userId: number) {
    return this.userCouponRepo.find({
      where: { user: { id: userId } },
      relations: ['coupon'],
    });
  }

  private calculateDiscount(amount: number, coupon: Coupon) {
    if (coupon.minPrice && amount < coupon.minPrice) {
      throw new BadRequestException(
        `Minimum purchase amount is ₹${coupon.minPrice}`,
      );
    }

    let discount = 0;

    if (coupon.type === 'FLAT') {
      discount = coupon.discountPrice;
    } else if (coupon.type === 'PERCENT') {
      discount = (amount * coupon.discountPercent) / 100;
      if (coupon.maxPrice) {
        discount = Math.min(discount, coupon.maxPrice);
      }
    }

    return {
      discount,
      finalAmount: Math.max(amount - discount, 0),
    };
  }

}
