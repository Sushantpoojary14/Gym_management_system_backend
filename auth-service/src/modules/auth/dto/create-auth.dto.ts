import { z } from 'zod';
import { UserRole } from 'src/common/enums/role.enum';
import { Gender } from 'src/common/enums/gender.enum';


export const CreateAuthSchema = z.object({
  email: z.email(),

  password: z.string(),

  phoneNumber: z.string(),

  fullName: z.string().optional(),

  gender: z.enum(Gender).nullable().optional(),

  dateOfBirth: z
    .union([z.coerce.date(), z.date(), z.null()])
    .refine((val) => val === null || val instanceof Date, {
      message: 'Date of birth must be a valid date',
    }),

  referralCode: z.string().optional(),

  role: z.enum(UserRole).optional(),

  isVerified: z.boolean().optional(),

  is18: z.enum(['true', 'false']).optional(),
});

export type CreateAuthDto = z.infer<typeof CreateAuthSchema>;

export const LoginSchema = z.object({
  email: z.email(),

  password: z.string(),
});

export type LoginDto = z.infer<typeof LoginSchema>;