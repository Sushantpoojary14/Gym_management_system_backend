// src/common/interceptors/response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../classes/api-response';

@Injectable()
export class ResponseFormatterInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const message =
      this.reflector.get<string>('successMessage', context.getHandler()) ||
      'Request successful';

    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        return new ApiResponse(message, data, null, response.statusCode);
      }),
    );
  }
}
