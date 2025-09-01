import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Coupon } from 'src/modules/coupons/entities/coupon.entity';

@Entity({ name: 'user_coupons' })
export class UserCoupon {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userCoupons, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Coupon, (coupon) => coupon.userCoupons, { eager: true })
  coupon: Coupon;

  @Column({ default: 0 })
  redeemedCount: number;

  @Column({ default: false })
  isRedeemed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  redeemedAt: Date;
}
