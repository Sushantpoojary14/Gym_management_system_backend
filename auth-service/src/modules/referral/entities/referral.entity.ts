import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'referral' })
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'referral_code' })
  referralCode: string;

  @Column({ name: 'referral_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  referralAmount: number;

  @Column({ name: 'wallet_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  walletAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}