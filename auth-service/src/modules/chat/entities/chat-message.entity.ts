import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ChatSession } from './chat.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChatSession, (session) => session.messages)
  session: ChatSession;

  @Column()
  senderId: number;

  @Column()
  message: string;

  @CreateDateColumn()
  sentAt: Date;
}
