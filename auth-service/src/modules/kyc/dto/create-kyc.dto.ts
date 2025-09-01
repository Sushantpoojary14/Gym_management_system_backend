
import { KycDocuments } from '@prisma/client';
import z from 'zod';

export const CreateKycSchema = z.object({
  documentType: z.enum(KycDocuments),
  documentNumber: z.string().min(1).max(255),
})

export type CreateKycDto = z.infer<typeof CreateKycSchema>;
