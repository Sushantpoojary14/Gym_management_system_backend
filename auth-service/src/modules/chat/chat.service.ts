import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private messageRepo: Repository<ChatMessage>,
  ) {}

  async createSession(userId: number): Promise<ChatSession> {
    const session = this.sessionRepo.create({ user: { id: userId } as any });
    return this.sessionRepo.save(session);
  }

  async assignAgent(sessionId: number, agentId: number) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    session.agentId = agentId;
    return this.sessionRepo.save(session);
  }


  async sendMessage(dto: CreateMessageDto) {
    const session = await this.sessionRepo.findOne({ where: { id: dto.sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const message = this.messageRepo.create({
      session,
      senderId: dto.senderId,
      message: dto.message,
    });
    return this.messageRepo.save(message);
  }

  async getMessages(sessionId: number) {
    return this.messageRepo.find({
      where: { session: { id: sessionId } },
      order: { sentAt: 'ASC' },
    });
  }

  async getSessionsForUser(userId: number) {
    return this.sessionRepo.find({ where: { user: { id: userId } } });
  }

  async closeSession(sessionId: number) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    return this.sessionRepo.remove(session);
  }
}
