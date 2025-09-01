import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PolicySection } from "./policySection.entity";
import { PolicyType } from "src/common/enums/policyTypes.enum";

@Entity({ name: 'policies' })
export class Policy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name:"heading", nullable: true })
  heading: string;

  @Column({name:"version", nullable: true })
  version: string;

  @Column({name:"is_active", default: true })
  isActive: boolean;

  @Column({name:"type",type:"enum",enum:PolicyType})
  type: PolicyType;

  @Column({ name:"media_url",nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  mediaType: 'image' | 'video';

  @Column({name:"policy_validity",nullable: true })
  policyValidity: Date;

  @CreateDateColumn({ name: 'policy_created_at' })
  policyCreatedAt: Date;

  @UpdateDateColumn({ name: 'policy_updated_at' })
  policyUpdatedAt: Date;

  @OneToMany(() => PolicySection, (section) => section.policy, { cascade: true, eager: true })
  sections: PolicySection[];
}

