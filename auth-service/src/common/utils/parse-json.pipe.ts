import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJSONPipe implements PipeTransform {
  transform(value: any) {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    } catch (err) {
      throw new BadRequestException('Invalid JSON format for sections');
    }
  }
}
