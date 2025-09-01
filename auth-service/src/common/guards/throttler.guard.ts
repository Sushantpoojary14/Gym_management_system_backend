import {
  Injectable,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ThrottlerGuard as DefaultThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class ThrottlerGuard extends DefaultThrottlerGuard {
  private readonly logger = new Logger('RateLimit');

  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
  const context = requestProps.context;
  const limit = requestProps.limit;
  const ttl = requestProps.ttl;

  const req = context.switchToHttp().getRequest<Request>();
  const clientIp = req.ip;

  try {
    return await super.handleRequest(requestProps);
  } catch (err) {
    this.logger.warn(
      `Rate limit exceeded. IP: ${clientIp}, URL: ${req.originalUrl}, Method: ${req.method}`,
    );
    throw err;
  }
}
}
