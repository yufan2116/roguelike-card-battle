import { z } from 'zod';

export const PurchaseMetaUpgradeSchema = z.object({
  upgradeId: z.enum(['max_hp', 'starting_gold', 'extra_choice', 'relic_pool']),
});

export type PurchaseMetaUpgradeRequest = z.infer<typeof PurchaseMetaUpgradeSchema>;
