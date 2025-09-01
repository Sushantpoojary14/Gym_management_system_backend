import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './entities/referral.entity';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
  ) {}

  /**
   * Find referral record by referral code
   */
  async findByCode(code: string): Promise<Referral | null> {
    return await this.referralRepository.findOne({
      where: { referralCode: code },
    });
  }

  /**
   * Create a referral entry for a new user
   */
  async createReferral(userId: number, code: string): Promise<Referral> {
    const referral = this.referralRepository.create({
      userId,
      referralCode: code,
      referralAmount: 0,
      walletAmount: 0,
    });
    return this.referralRepository.save(referral);
  }

  /**
   * Add earnings for referral user (referrer)
   */
  async addReferralAmount(userId: number, amount: number): Promise<Referral> {
    const referral = await this.referralRepository.findOne({ where: { userId } });
    if (!referral) throw new NotFoundException('Referral not found for user');
    referral.referralAmount = +referral.referralAmount + amount;
    return this.referralRepository.save(referral);
  }

  /**
   * Add wallet bonus to the referred user (new account)
   */
  async addWalletBonus(userId: number, amount: number): Promise<Referral> {
    const referral = await this.referralRepository.findOne({ where: { userId } });
    if (!referral) throw new NotFoundException('Referral not found for user');
    referral.walletAmount = +referral.walletAmount + amount;
    return this.referralRepository.save(referral);
  }

  /**
   * Update both users: referralAmount (referrer) + walletAmount (new user)
   */
  async incrementBoth(referrerUserId: number, referredUserId: number, refAmount = 50, signupBonus = 20) {
    const referrer = await this.referralRepository.findOne({ where: { userId: referrerUserId } });
    const referred = await this.referralRepository.findOne({ where: { userId: referredUserId } });

    if (!referrer || !referred) {
      throw new NotFoundException('Referral data missing for one of the users');
    }

    referrer.referralAmount = +referrer.referralAmount + refAmount;
    referred.walletAmount = +referred.walletAmount + signupBonus;

    await this.referralRepository.save([referrer, referred]);
  }

  /**
   * Optional: Get referral dashboard info
   */
  async getReferralInfo(userId: number) {
    const referral = await this.referralRepository.findOne({ where: { userId } });
    if (!referral) throw new NotFoundException('Referral info not found');
    return {
      referralCode: referral.referralCode,
      referralAmount: referral.referralAmount,
      walletAmount: referral.walletAmount,
    };
  }
}
