import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Policy } from './policy.entity';

@Entity()
export class PolicySection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subHeading: string;

  @Column('text')
  description: string;

  @ManyToOne(() => Policy, (policy) => policy.sections, { onDelete: 'CASCADE' })
  policy: Policy;
}
