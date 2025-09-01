import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}
  private readonly logFile = path.join(process.cwd(), 'logs', 'errors.log');
  transform(value: any, metadata: ArgumentMetadata) {
    const parsedValue = this.schema.safeParse(value);
    if (parsedValue.success) return parsedValue.data;
    const errorMessages = parsedValue.error.issues
      .map((issue) => `${issue.path.join('.')} - ${issue.message}`)
      .join(', ');
    this.writeErrorLog(errorMessages, metadata);

    throw new BadRequestException(errorMessages);
  }

  private writeErrorLog(exception: unknown, metadata: ArgumentMetadata) {
    try {
      // Ensure logs directory exists
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = {
        time: new Date().toISOString(),
        method: metadata.type,
        status: 400,
        response: exception,
        stack: exception instanceof Error ? exception.stack : exception,
      };

      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (err) {
      console.error('Failed to write error log:', err);
    }
  }
}
