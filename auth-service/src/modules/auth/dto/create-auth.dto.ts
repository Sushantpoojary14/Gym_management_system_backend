import { z } from 'zod';

import { Gender, UserRole } from '@prisma/client';


export const CreateAuthSchema = z.object({
  email: z.email(),

  password: z.string().min(8).max(255),
  // .regex(
  //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  //   'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  // )
  phoneNumber: z.string().min(10).max(15),

  firstName: z.string(),

  lastName: z.string(),

  gender: z.enum(Gender).optional(),

  dateOfBirth: z
    .union([z.coerce.date(), z.date(), z.null()])
    .refine((val) => val === null || val instanceof Date, {
      message: 'Date of birth must be a valid date',
    })
    .optional(),
  role: z.enum(UserRole).optional(),
  profile_image: z.string().optional(),
});

export type CreateAuthDto = z.infer<typeof CreateAuthSchema>;

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const VerifyOtpSchema = z.object({
  otp: z.string().min(6).max(6),
  email: z.email(),
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;