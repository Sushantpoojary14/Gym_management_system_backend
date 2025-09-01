import { Gender } from 'src/common/enums/gender.enum';
import { UserRole } from 'src/common/enums/role.enum';
import { UserStatus } from 'src/common/enums/status.enum';
import { UserCoupon } from 'src/modules/user-coupon/entities/user-coupon.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';



@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password', nullable: true })
  password: string;

  @Column({ name: 'phone', unique: true })
  phone: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'gender',type: 'enum',enum: Gender, nullable: true })
  gender: Gender;

  @Column({name: 'role',type: 'enum',enum: UserRole,default: UserRole.USER, nullable: false})
  role: UserRole;

  @Column({ name: 'profile_url', nullable: true })
  profileUrl: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({name:"scheduled_deletionDate",type:"timestamp",nullable:true})
  scheduledDeletionDate: Date

  @Column({ name: 'status',type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ name: 'last_seen', type: 'timestamp', nullable: true })
  lastSeen: Date; 

  @Column({name:"is_18",default:false})
  is18: boolean

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserCoupon, (uc) => uc.user)
  userCoupons: UserCoupon[];
}