import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('session')
  createSession(@Body('userId') userId: number) {
    return this.chatService.createSession(userId);
  }

  @Post('assign')
  assignAgent(@Body() body: { sessionId: number; agentId: number }) {
    return this.chatService.assignAgent(body.sessionId, body.agentId);
  }

  @Get('messages/:sessionId')
  getMessages(@Param('sessionId') sessionId: number) {
    return this.chatService.getMessages(sessionId);
  }

  @Get('sessions/:userId')
  getSessions(@Param('userId') userId: number) {
    return this.chatService.getSessionsForUser(userId);
  }
}
