import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // password?: never;
  isVerified?: boolean;
  is18?: never;
  lastSeen?: any;
  reqUrl?: string;
}
