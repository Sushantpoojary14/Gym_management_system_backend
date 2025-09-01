import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { Reflector } from '@nestjs/core';
import { Public, Roles } from './auth.decorator';
import { RoleDto } from './auth.dto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isPublic = this.reflector.get<boolean>(
        Public,
        context.getHandler(),
      );
      const roles: RoleDto[] = this.reflector.get<RoleDto[]>(
        Roles,
        context.getHandler(),
      );

      if (isPublic) {
        return true;
      }
      const request = context.switchToHttp().getRequest();
      const { authorization }: any = request.headers;
      if (!authorization || authorization.trim() === '') {
        throw new UnauthorizedException('Please provide token');
      }
      const authToken = authorization.replace(/bearer/gim, '').trim();

      const resp = await this.authService.validateToken(authToken);
      request.user = resp;  
      if (!roles.includes(resp.role)) {
        throw new ForbiddenException(
          'You are not authorized to access this resource',
        );
      }
     
      return true;
    } catch (error) {
      console.log('auth error - ', error.message);
      throw new ForbiddenException(
        error.message || 'session expired! Please sign In',
      );
    }
  }
}
