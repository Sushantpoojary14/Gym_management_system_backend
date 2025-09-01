import { z } from 'zod';
import { RoleEnum } from './role.enum';

export const roleSchema = z.enum(Object.values(RoleEnum));

export type RoleDto = z.infer<typeof roleSchema>;
