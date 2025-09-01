import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer() server: Server;

  constructor(
    private chatService: ChatService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  /** When user or agent joins */
  @SubscribeMessage('joinChat')
  async handleJoin(
    @MessageBody() { userId, role }: { userId: number; role: string },
    @ConnectedSocket() client: Socket,
  ) {
    let session;

    if (role === 'USER') {
      session = await this.chatService.createSession(userId);
    } else {
      client.emit('error', { message: 'Agents must join specific sessions.' });
      return;
    }

    client.join(`chat-${session.id}`);
    console.log(`${role} joined chat-${session.id}`);

    // Store socket mapping in Redis
    await this.redisClient.hset(
      `chat:session:${session.id}:connections`,
      client.id,
      JSON.stringify({ userId, role }),
    );

    // Send session info to user
    client.emit('sessionCreated', { sessionId: session.id });
  }

  /** When agent joins existing session */
  @SubscribeMessage('joinAsAgent')
  async handleAgentJoin(
    @MessageBody() { sessionId, agentId }: { sessionId: number; agentId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.assignAgent(sessionId, agentId);

    client.join(`chat-${sessionId}`);
    console.log(`Agent ${agentId} joined chat-${sessionId}`);

    await this.redisClient.hset(
      `chat:session:${sessionId}:connections`,
      client.id,
      JSON.stringify({ userId: agentId, role: 'AGENT' }),
    );

    // Notify user that agent is assigned
    this.server.to(`chat-${sessionId}`).emit('agentAssigned', { agentId });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() dto: { sessionId: number; senderId: number; senderRole: string; message: string },
  ) {
    const savedMessage = await this.chatService.sendMessage(dto);
    await this.redisClient.publish('chat-messages', JSON.stringify(savedMessage));

    // Send message to everyone in session
    this.server.to(`chat-${dto.sessionId}`).emit('receiveMessage', savedMessage);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Find session where this client exists
    const keys = await this.redisClient.keys('chat:session:*:connections');

    for (const key of keys) {
      const connections = await this.redisClient.hgetall(key);

      if (connections[client.id]) {
        const sessionId = key.split(':')[2];
        const disconnectedUser = JSON.parse(connections[client.id]);

        // Remove this client's socket
        await this.redisClient.hdel(key, client.id);

        // Notify the other participant
        this.server
          .to(`chat-${sessionId}`)
          .emit('userLeft', {
            userId: disconnectedUser.userId,
            role: disconnectedUser.role,
            sessionId,
          });

        // Check if anyone is left
        const remaining = await this.redisClient.hlen(key);

        if (remaining === 0) {
          await this.redisClient.del(key);
          console.log(`Session ${sessionId} closed (both left).`);
        }

        break;
      }
    }
  }
}
