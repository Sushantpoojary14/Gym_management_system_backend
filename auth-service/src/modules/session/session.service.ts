import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
  ) {}

  async createSession(userId: number, refreshToken: string, expiresAt: number): Promise<Session> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    const session = this.sessionRepo.create({
      userId,
      refreshToken: hashed,
      expiresAt,
    });
    return await this.sessionRepo.save(session);
  }

  async updateSession(sessionId: number, updated: Partial<Session>) {
    await this.sessionRepo.update(sessionId, updated);
  }


  async findValidSession(userId: number, sessionId: number, refreshToken: string): Promise<Session|null> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId, revoked: false },
    });

    if (!session || session.expiresAt < Date.now()) return null;

    const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
    return isMatch ? session : null;
  }

  async revokeSession(sessionId: number) {
    const session=await this.sessionRepo.findOne({where:{id:sessionId}})
    if(!session) throw new UnauthorizedException('Session not found')
    if(session.revoked) throw new UnauthorizedException('Session already revoked')
    return this.sessionRepo.update(sessionId, { revoked: true });
  }

  async revokeAllSessions(userId: number): Promise<void> {
    const sessions = await this.sessionRepo.find({ where: { userId, revoked: false } });
    if (!sessions.length) {
      throw new UnauthorizedException('No active sessions found for the user');
    }
    await this.sessionRepo.update({ userId }, { revoked: true });
  }
}