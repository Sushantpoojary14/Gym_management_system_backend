import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { ChatMessage } from './chat-message.entity';


@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true })
  agentId: number

  @Column({ default: 'open' })
  status: 'open' | 'closed';

  @OneToMany(() => ChatMessage, (msg) => msg.session)
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;
}
