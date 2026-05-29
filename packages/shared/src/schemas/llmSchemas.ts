import { z } from 'zod';
import type { GenerationValidationReport } from '../validation/generateValidator.js';

export const GenerateClassPackRequestSchema = z.object({
  theme: z.string().min(2).max(200),
  nameHint: z.string().max(80).optional(),
  classIdPrefix: z
    .string()
    .regex(/^[a-z][a-z0-9_]*$/)
    .max(24)
    .optional(),
  cardCount: z.number().int().min(20).max(30).optional(),
  userPrompt: z.string().max(1000).optional(),
});

export const ApproveDraftRequestSchema = z.object({
  unlockClass: z.boolean().optional(),
});

export type GenerateClassPackRequest = z.infer<typeof GenerateClassPackRequestSchema>;

export interface GeneratedClassDraft {
  id: string;
  createdAt: string;
  theme: string;
  status: 'pending' | 'validated' | 'rejected' | 'approved';
  usedFallback: boolean;
  pack: unknown;
  validation: GenerationValidationReport;
  prompt?: string;
}

export interface DraftsRegistry {
  drafts: GeneratedClassDraft[];
}
