import type { CardDefinition, CardRarity, NodeType } from '../types/game.js';
import { shuffleWithSeed } from '../rng/seededRandom.js';

const WEIGHTS: Record<NodeType, Record<string, number>> = {
  normal_combat: { common: 60, uncommon: 30, rare: 10 },
  elite_combat: { common: 20, uncommon: 50, rare: 30 },
  boss: { common: 15, uncommon: 35, rare: 50 },
  random_event: { common: 50, uncommon: 35, rare: 15 },
  shop: { common: 50, uncommon: 35, rare: 15 },
  rest: { common: 50, uncommon: 35, rare: 15 },
  treasure: { common: 50, uncommon: 35, rare: 15 },
};

function weightedPick(
  seed: string,
  pool: CardDefinition[],
  weights: Record<string, number>
): CardDefinition {
  const entries = pool.filter((c) => (weights[c.rarity] ?? 0) > 0);
  if (entries.length === 0) return pool[0];

  const total = entries.reduce((s, c) => s + (weights[c.rarity] ?? 0), 0);
  let roll = 0;
  for (const ch of seed) roll = (roll + ch.charCodeAt(0)) % total;

  for (const card of entries) {
    roll -= weights[card.rarity] ?? 0;
    if (roll < 0) return card;
  }
  return entries[entries.length - 1];
}

export function generateRewardCardIds(
  seed: string,
  classId: string,
  allCards: CardDefinition[],
  nodeType: NodeType = 'normal_combat',
  count = 3,
  extraChoices = 0
): string[] {
  const total = count + extraChoices;
  const pool = allCards.filter(
    (c) => c.classId === classId && c.rarity !== 'starter'
  );
  if (pool.length === 0) {
    return allCards.filter((c) => c.classId === classId).slice(0, total).map((c) => c.id);
  }

  const weights = WEIGHTS[nodeType] ?? WEIGHTS.normal_combat;
  const shuffled = shuffleWithSeed(seed, pool);
  const picked: string[] = [];
  const used = new Set<string>();

  for (let i = 0; i < total; i++) {
    const available = shuffled.filter((c) => !used.has(c.id));
    if (available.length === 0) break;
    const card = weightedPick(`${seed}:pick:${i}`, available, weights);
    picked.push(card.id);
    used.add(card.id);
  }

  return picked;
}

export function getClassCardPoolSummary(
  allCards: CardDefinition[],
  classId: string
): Record<CardRarity, number> {
  const cards = allCards.filter((c) => c.classId === classId);
  return {
    starter: cards.filter((c) => c.rarity === 'starter').length,
    common: cards.filter((c) => c.rarity === 'common').length,
    uncommon: cards.filter((c) => c.rarity === 'uncommon').length,
    rare: cards.filter((c) => c.rarity === 'rare').length,
  };
}
