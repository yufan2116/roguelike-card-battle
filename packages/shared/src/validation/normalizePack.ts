import type { GeneratedClassPackInput } from '../schemas/gameSchemas.js';
import type { CardEffect } from '../types/game.js';
import { calculateCardPowerBudget } from './powerBudget.js';

/** 将 powerBudget 同步为 effects 计算值（LLM 常算错声明值） */
export function normalizeGeneratedClassPack(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const pack = raw as GeneratedClassPackInput;
  if (!pack.class || !Array.isArray(pack.cards)) return raw;

  return {
    ...pack,
    cards: pack.cards.map((card) => ({
      ...card,
      powerBudget: calculateCardPowerBudget(card.effects as CardEffect[]),
    })),
  };
}
