import { z } from 'zod';
import { EFFECT_MECHANISMS } from '../types/game.js';

export const CardEffectSchema = z.object({
  mechanism: z.enum(EFFECT_MECHANISMS as unknown as [string, ...string[]]),
  value: z.number(),
  target: z.enum(['self', 'enemy', 'all_enemies', 'random_enemy']).optional(),
  duration: z.number().int().positive().optional(),
});

export const CardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  classId: z.string().min(1),
  type: z.enum(['attack', 'defense', 'skill', 'status', 'curse']),
  cost: z.number().int().min(0).max(3),
  rarity: z.enum(['common', 'uncommon', 'rare', 'starter']),
  description: z.string(),
  effects: z.array(CardEffectSchema).min(1),
  upgradedEffects: z.array(CardEffectSchema).optional(),
  powerBudget: z.number(),
  imagePrompt: z.string(),
  imagePath: z.string().optional(),
  styleTags: z.array(z.string()).optional(),
});

export const ClassSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  maxHp: z.number().int().positive(),
  startingGold: z.number().int().min(0),
  starterDeck: z.array(z.string()).min(5),
  recommendedRelics: z.array(z.string()),
  imagePrompt: z.string(),
  imagePath: z.string().optional(),
  styleTags: z.array(z.string()).optional(),
});

export const RelicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  trigger: z.string(),
  params: z.record(z.union([z.number(), z.string(), z.boolean()])),
  rarity: z.enum(['common', 'uncommon', 'rare', 'boss']),
  imagePrompt: z.string(),
  imagePath: z.string().optional(),
  styleTags: z.array(z.string()).optional(),
});

export const EnemyActionSchema = z.object({
  id: z.string(),
  intent: z.object({
    type: z.enum(['attack', 'defend', 'buff', 'debuff', 'special']),
    value: z.number(),
    description: z.string(),
  }),
  effects: z.array(CardEffectSchema),
});

export const BossPhaseSchema = z.object({
  phase: z.number().int().positive(),
  hpThreshold: z.number().min(0).max(1),
  actions: z.array(EnemyActionSchema).min(1),
  onEnterEffects: z.array(CardEffectSchema).optional(),
});

export const EnemySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  maxHp: z.number().int().positive(),
  isElite: z.boolean().optional(),
  isBoss: z.boolean().optional(),
  actions: z.array(EnemyActionSchema).min(1),
  phases: z.array(BossPhaseSchema).optional(),
  imagePrompt: z.string(),
  imagePath: z.string().optional(),
});

export const BossSchema = EnemySchema.extend({
  isBoss: z.literal(true),
  phases: z.array(BossPhaseSchema).min(1),
});

export const GeneratedClassPackSchema = z.object({
  class: ClassSchema,
  cards: z.array(CardSchema).min(20).max(30),
  recommendedRelics: z.array(z.string()),
});

export type CardInput = z.infer<typeof CardSchema>;
export type ClassInput = z.infer<typeof ClassSchema>;
export type GeneratedClassPackInput = z.infer<typeof GeneratedClassPackSchema>;
