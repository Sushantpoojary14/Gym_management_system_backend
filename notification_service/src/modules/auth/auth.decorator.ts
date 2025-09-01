import { Reflector } from '@nestjs/core';
import { RoleDto } from './auth.dto';

export const Public = Reflector.createDecorator<boolean>();
export const Roles = Reflector.createDecorator<RoleDto[]>();
