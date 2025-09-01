import { Channel, NotificationType, Priority, Purpose } from '@prisma/client';
import z from 'zod';

export const intStringSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const num = parseInt(val);
    return isNaN(num) ? undefined : num;
  }
  return val;
}, z.number());

export type IntString = z.infer<typeof intStringSchema>;
/* -----------------------------
   Date coercion helper
   ----------------------------- */
const DateFromString = z.preprocess((val) => {
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return val;
}, z.date());

/* -----------------------------
   CreateNotificationDto schema
   ----------------------------- */
export const CreateNotificationSchema = z.object({
  userId: intStringSchema,
  type: z.enum(NotificationType),
  priority: z.enum(Priority).default(Priority.medium),
  title: z.string(),
  message: z.string(),
  metadata: z
    .any()
    .transform((val) => (typeof val === 'string' ? JSON.parse(val) : val))
    .optional(),
  purpose: z.enum(Purpose),
  referenceId: z.string().nullable().optional(),
  referenceType: z.string().nullable().optional(),
  // accept Date or string that can be parsed to Date
  scheduledAt: DateFromString.optional().nullable(),
  channels: z.array(z.enum(Channel)),
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>;

/* -----------------------------
   NotificationPayload schema
   ----------------------------- */
export const NotificationPayloadSchema = z.object({
  id: intStringSchema,
  userId: intStringSchema,
  type: z.enum(NotificationType),
  priority: z.enum(Priority),
  purpose: z.enum(Purpose),
  title: z.string(),
  message: z.string(),
  metadata: z
  .any()
  .transform((val) => (typeof val === 'string' ? JSON.parse(val) : val))
  .optional(),
  referenceId: z.string().nullable().optional(),
  referenceType: z.string().nullable().optional(),
  channels: z.array(z.enum(Channel)),
  createdAt: DateFromString,
});

export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;

/* -----------------------------
   ProcessNotificationDto schema
   ----------------------------- */
export const ProcessNotificationSchema = z.object({
  notificationId: intStringSchema,
  attempt: z.number().int().nonnegative(),
});

export type ProcessNotificationDto = z.infer<typeof ProcessNotificationSchema>;

export const NotificationPayloadWithUserSchema =
  NotificationPayloadSchema.extend({
    user: z.object({
      id: intStringSchema,
      email: z.string(),
      name: z.string().optional(),
    }),
  });

export type NotificationPayloadWithUser = z.infer<
  typeof NotificationPayloadWithUserSchema
>;
