import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { KycStatus } from 'src/common/enums/kycStatus.enum';
import { KycDocuments } from 'src/common/enums/kycDocuments.enum';


@Entity({ name: 'kyc' })
export class Kyc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'document_type',type: 'enum', enum: KycDocuments, default:null})
  documentType: KycDocuments;

  @Column({ name: 'document_number', unique: true })
  documentNumber: string;

  @Column({ name: 'document_url' })
  documentUrl: string;

  @Column({ name: 'selfie_url' })
  selfieUrl: string;

  @Column({ name: 'kyc_status',type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ name: 'admin_remark', nullable: true })
  adminRemark: string;

  @Column({name:"approved_by",nullable:true})
  approvedBy: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
