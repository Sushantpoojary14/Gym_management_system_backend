
import z from 'zod';

export const passwordScheme = z.object({
  email: z.email(),
  newPassword: z.string(),
  confirmPassword: z.string(),
});
export type passwordDto = z.infer<typeof passwordScheme>;

export const updatePasswordScheme = z.object({
  userId: z.string(),
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
});
export type updatePasswordDto = z.infer<typeof updatePasswordScheme>;
