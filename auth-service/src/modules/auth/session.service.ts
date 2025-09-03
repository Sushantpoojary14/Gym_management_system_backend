import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/database/prisma.service';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async createSession(
    userId: string,
    refreshToken: string,
    expiresAt: number,
  ): Promise<RefreshToken> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    const sessionExist = await this.prisma.refreshToken.findUnique({
      where: { userId },
    });
    if (sessionExist) {
      await this.prisma.refreshToken.delete({ where: { id: sessionExist.id } });
    }
    const session = await this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashed,
        expiresAt :new Date(expiresAt),
      },
    });
    return session;
  }

  async updateSession(sessionId: string, updated: Partial<RefreshToken>) {
    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: updated,
    });
  }

  async findValidSession(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<RefreshToken | null> {
    const session = await this.prisma.refreshToken.findUnique({
      where: { id: sessionId, userId, revoked: false },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) return null;

    const isMatch = await bcrypt.compare(refreshToken, session.token);
    return isMatch ? session : null;
  }

  async revokeSession(sessionId: string) {
    const session = await this.prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new UnauthorizedException('Session not found');
    if (session.revoked)
      throw new UnauthorizedException('Session already revoked');
    return this.prisma.refreshToken.update({ where: { id: sessionId }, data: { revoked: true } });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false },
    });
    if (!sessions.length) {
      throw new UnauthorizedException('No active sessions found for the user');
    }
    await this.prisma.refreshToken.update({ where: { userId }, data: { revoked: true } });
  }
}
