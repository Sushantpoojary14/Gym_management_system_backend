import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Repository } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { generateCouponCode } from 'src/common/utils/referral-code.util';
import { CouponAction } from 'src/common/enums/couponAction.enum';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) { }

  async create(createCouponDto: CreateCouponDto): Promise<Coupon | any> {
    const { type, discountPrice, discountPercent, validTill, redemtionLimit, description, maxPrice,triggerAction,autoAssign } = createCouponDto;
    try {
      const couponCode = await this.generateUniqueCouponCode();
      const coupon = this.couponRepository.create({
        couponCode,
        type,
        discountPrice,
        discountPercent,
        validTill,
        redemtionLimit,
        description,
        maxPrice,
        triggerAction,
        autoAssign
      });
      return await this.couponRepository.save(coupon);
    } catch (error) {
      throw new InternalServerErrorException(error.message ?? 'Failed to create coupon');
    }
  }

  private async generateUniqueCouponCode(): Promise<string> {
    let code = '';
    let exists = true;

    while (exists) {
      code = generateCouponCode();
      exists = !!(await this.couponRepository.findOneBy({ couponCode: code }));
    }

    return code;
  }

  async findAll(page = 1, limit = 10) {
    return this.couponRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      order: { validTill: 'DESC' },
    });
  }

  async findByCode(code: string) {
    const coupon = await this.couponRepository.findOne({ where: { couponCode: code } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async findByAction(action: CouponAction) {
    return this.couponRepository.find({
      where: { triggerAction: action, autoAssign: true },
    });
  }

  async findOne(id: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const { type, discountPrice, discountPercent, validTill, redemtionLimit, description, maxPrice } = updateCouponDto;
    try {
      const coupon = await this.couponRepository.findOne({ where: { id } });
      if (!coupon) throw new NotFoundException('Coupon not found');
      if (type) coupon.type = type;
      if (discountPrice) coupon.discountPrice = discountPrice;
      if (discountPercent) coupon.discountPercent = discountPercent;
      if (validTill) coupon.validTill = validTill;
      if (redemtionLimit) coupon.redemtionLimit = redemtionLimit;
      if (description) coupon.description = description;
      if (maxPrice) coupon.maxPrice = maxPrice;

      await this.couponRepository.save(coupon);
      return await this.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message ?? 'Failed to update coupon');
    }
  }

  async remove(id: number): Promise<string> {
    const result = await this.couponRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Coupon not found');
    }
    return "Coupon removed successfully";
  }

}
