import { z } from 'zod';

export const ImageEntityTypeSchema = z.enum(['class', 'card', 'relic', 'enemy', 'boss']);

export const ArtStylePresetSchema = z.enum([
  'dark_fairy_tale',
  'pixel',
  'anime',
  'oil_painting',
  'dungeon_realistic',
]);

export const GenerateImageRequestSchema = z.object({
  entityType: ImageEntityTypeSchema,
  entityId: z.string().min(1),
  preset: ArtStylePresetSchema,
  customPrompt: z.string().max(500).optional(),
  /** 怪物分层资源角色（enemy/boss 专用） */
  assetRole: z.enum(['portrait', 'background', 'combined']).optional(),
});

export const SetActiveVariantRequestSchema = z.object({
  entityType: ImageEntityTypeSchema,
  entityId: z.string().min(1),
  variantId: z.string().min(1),
});

export const SetGlobalPresetRequestSchema = z.object({
  preset: ArtStylePresetSchema,
});

export const BatchGenerateRequestSchema = z.object({
  entityType: ImageEntityTypeSchema,
  preset: ArtStylePresetSchema,
  customPrompt: z.string().max(500).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

export type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;
export type SetActiveVariantRequest = z.infer<typeof SetActiveVariantRequestSchema>;
