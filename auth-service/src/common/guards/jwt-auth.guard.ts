import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

export interface JwtUser {
    id: string;
    role: UserRole;
  }
  
  @Injectable()
  export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(
      err: any,
      user: JwtUser,
      info: any,
      context: ExecutionContext,
      status?: any,
    ): any {
      if (err || !user) {
        throw err || new UnauthorizedException('Authentication token missing or invalid');
      }
      return user;
    }
  }