import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

interface MyResponseObj {
  statusCode: number;
  timestamp: string;
  path: string;
  response: any;
}

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter implements ExceptionFilter {
  private readonly logFile = path.join(process.cwd(), 'logs', 'errors.log');
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
   
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const myResponseObj: MyResponseObj = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: 'Internal Server Error',
    };

    if (exception instanceof HttpException) {
      myResponseObj.statusCode = exception.getStatus();
      myResponseObj.response = exception.getResponse();
    } else if (exception instanceof PrismaClientValidationError) {
      myResponseObj.statusCode = 422;
      myResponseObj.response = exception.message.replaceAll(/\n/g, ' ');
    }

    // Log error to file
    this.writeErrorLog(exception, myResponseObj, request);

    response.status(myResponseObj.statusCode).json(myResponseObj);

    super.catch(exception, host);
  }

  private writeErrorLog(exception: unknown, myResponseObj: MyResponseObj, request: Request) {
    try {
      // Ensure logs directory exists
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = {
        time: myResponseObj.timestamp,
        method: request.method,
        url: request.url,
        status: myResponseObj.statusCode,
        response: myResponseObj.response,
        stack: exception instanceof Error ? exception.stack : exception,
      };

      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (err) {
      console.error('Failed to write error log:', err);
    }
  }
}
