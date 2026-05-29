import { z } from 'zod';

export const SimStrategySchema = z.enum(['greedy', 'defensive', 'aggressive']);
export const SimDeckModeSchema = z.enum(['starter', 'full_pool']);

export const RunSimRequestSchema = z.object({
  classId: z.string().min(1),
  enemyId: z.string().min(1),
  strategy: SimStrategySchema.optional(),
  deckMode: SimDeckModeSchema.optional(),
  runs: z.number().int().min(4).max(100).optional(),
});

export const RunClassAuditRequestSchema = z.object({
  classId: z.string().min(1),
  runsPerCell: z.number().int().min(4).max(64).optional(),
  strategies: z.array(SimStrategySchema).min(1).max(3).optional(),
});

export const RunGlobalAuditRequestSchema = z.object({
  runsPerCell: z.number().int().min(4).max(32).optional(),
  strategies: z.array(SimStrategySchema).min(1).max(3).optional(),
});

export type RunSimRequest = z.infer<typeof RunSimRequestSchema>;
export type RunClassAuditRequest = z.infer<typeof RunClassAuditRequestSchema>;
export type RunGlobalAuditRequest = z.infer<typeof RunGlobalAuditRequestSchema>;
