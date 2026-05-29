import { EFFECT_MECHANISMS } from '../types/game.js';

/** LLM 系统提示：要求只输出 JSON */
export const LLM_CLASS_SYSTEM_PROMPT = `You are a roguelike deckbuilder game designer for "遗迹吞忆" (Memory Devouring Ruins).
Design ONE new player class with 20-30 cards. Output ONLY a single JSON object, no markdown fences.

JSON shape:
{
  "class": {
    "id": "snake_case_unique_id",
    "name": "Chinese display name",
    "description": "1-2 sentences in Chinese",
    "maxHp": 65-80,
    "startingGold": 99,
    "starterDeck": ["card_id", ... exactly 10 entries, only starter/common cards],
    "recommendedRelics": ["existing_relic_id", ... 2 items from provided list],
    "imagePrompt": "English art prompt for character portrait",
    "styleTags": ["dark_fairy_tale"]
  },
  "cards": [ ... 20-30 card objects ... ],
  "recommendedRelics": ["same 2 relic ids as class.recommendedRelics"]
}

Each card:
{
  "id": "{class_prefix}_snake_name",
  "name": "Chinese name",
  "classId": "must match class.id",
  "type": "attack|defense|skill|status|curse",
  "cost": 0-3,
  "rarity": "starter|common|uncommon|rare",
  "description": "Chinese, concise",
  "effects": [{ "mechanism": "...", "value": number, "target": "self|enemy|all_enemies|random_enemy" }],
  "powerBudget": number (must equal sum of mechanism power),
  "imagePrompt": "English card art prompt"
}

Allowed mechanisms ONLY: ${EFFECT_MECHANISMS.join(', ')}

Power budget rules (calculated = sum of mechanism power, must be <= limit):
- cost 0: max 6
- cost 1: max 12
- cost 2: max 20
- cost 3: max 30

Mechanism power per point: damage=1, block=0.8, draw=6, gainEnergy=8, heal=3, applyBleed=2, applyWeak=4, applyVulnerable=4, applyPoison=2, gainStrength=4, gainDexterity=4

Design rules:
- Theme must fit memory-absorbing dungeon fantasy (original, not Slayer of Spire copies)
- starterDeck: 4 basic attacks, 4 basic defenses, 2 signature cards
- Include 6-8 starter rarity, rest common/uncommon with 2-4 rare
- All card IDs unique, snake_case, prefixed with class id abbreviation
- recommendedRelics MUST be chosen ONLY from the provided relic id list
- Do NOT invent relic ids
- descriptions in Simplified Chinese
- imagePrompt in English`;

export function buildClassGenerationUserPrompt(options: {
  theme: string;
  nameHint?: string;
  classIdPrefix?: string;
  cardCount?: number;
  userPrompt?: string;
  availableRelicIds: string[];
}): string {
  const lines = [
    `Theme / 流派概念: ${options.theme}`,
    options.nameHint ? `Name hint: ${options.nameHint}` : '',
    options.classIdPrefix
      ? `Use class id prefix starting with: ${options.classIdPrefix}`
      : 'Generate a unique snake_case class id',
    `Target card count: ${options.cardCount ?? 25}`,
    `Available relic ids (pick exactly 2): ${options.availableRelicIds.join(', ')}`,
    options.userPrompt ? `Additional design notes: ${options.userPrompt}` : '',
  ].filter(Boolean);

  return lines.join('\n');
}
