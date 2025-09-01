import { CouponAction } from 'src/common/enums/couponAction.enum';
import { UserCoupon } from 'src/modules/user-coupon/entities/user-coupon.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

export type CouponType = 'FLAT' | 'PERCENT';

@Entity({ name: 'coupons' })
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  couponCode: string;

  @Column({ type: 'enum', enum: ['FLAT', 'PERCENT'] })
  type: CouponType;

  @Column({ type: 'float', nullable: true })
  minPrice: number;

  @Column({ type: 'float', nullable: true })
  discountPrice: number;

  @Column({ type: 'float', nullable: true })
  discountPercent: number;

  @Column({ type: 'timestamp' })
  validTill: Date;

  @Column({ default: 0 })
  redemtionLimit: number;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'float', nullable: true })
  maxPrice: number;

  @Column({
    type: 'enum',
    name: 'trigger_action',
    enum: CouponAction,
    default: CouponAction.NONE
  })
  triggerAction: CouponAction;

  @Column({name:"auto_assign",default:false})
  autoAssign: boolean

  @OneToMany(() => UserCoupon, (userCoupon) => userCoupon.coupon)
  userCoupons: UserCoupon[];
}
