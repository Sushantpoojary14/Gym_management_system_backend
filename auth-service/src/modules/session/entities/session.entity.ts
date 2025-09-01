import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'refresh_token' })
  refreshToken: string;

  @Column({ default: false })
  revoked: boolean;

  @Column({ name: 'expires_at', type: 'bigint' })
  expiresAt: number

  @CreateDateColumn()
  createdAt: Date;
}