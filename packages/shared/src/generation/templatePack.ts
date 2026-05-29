import type { CardDefinition, ClassDefinition } from '../types/game.js';
import type { GeneratedClassPackInput } from '../schemas/gameSchemas.js';
import { calculateCardPowerBudget } from '../validation/powerBudget.js';
import type { CardEffect } from '../types/game.js';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'custom_class';
}

function card(
  id: string,
  name: string,
  classId: string,
  type: CardDefinition['type'],
  cost: number,
  rarity: CardDefinition['rarity'],
  description: string,
  effects: CardEffect[],
  imagePrompt: string
): CardDefinition {
  return {
    id,
    name,
    classId,
    type,
    cost,
    rarity,
    description,
    effects,
    powerBudget: calculateCardPowerBudget(effects),
    imagePrompt,
  };
}

/** 无 LLM API Key 时的规则化模板生成（可跑通校验流程） */
export function buildTemplateClassPack(options: {
  theme: string;
  nameHint?: string;
  classIdPrefix?: string;
  cardCount?: number;
  relicIds: [string, string];
}): GeneratedClassPackInput {
  const baseId = options.classIdPrefix ?? slugify(options.nameHint ?? options.theme);
  const classId = baseId.replace(/[^a-z0-9_]/g, '_');
  const prefix = classId.split('_').map((p) => p.slice(0, 2)).join('') || 'gc';
  const displayName = options.nameHint ?? `${options.theme.slice(0, 8)}行者`;
  const count = options.cardCount ?? 22;

  const cards: CardDefinition[] = [
    card(`${prefix}_strike`, `${options.theme.slice(0, 4)}击`, classId, 'attack', 1, 'starter', '造成 5 点伤害。', [{ mechanism: 'damage', value: 5, target: 'enemy' }], `${options.theme} strike attack`),
    card(`${prefix}_guard`, `${options.theme.slice(0, 4)}护`, classId, 'defense', 1, 'starter', '获得 5 点格挡。', [{ mechanism: 'block', value: 5, target: 'self' }], `${options.theme} guard block`),
    card(`${prefix}_sig_a`, '忆痕斩', classId, 'attack', 1, 'starter', '造成 8 点伤害，施加 2 层流血。', [{ mechanism: 'damage', value: 8, target: 'enemy' }, { mechanism: 'applyBleed', value: 2, target: 'enemy' }], `${options.theme} bleed slash`),
    card(`${prefix}_sig_b`, '残忆护盾', classId, 'defense', 1, 'starter', '获得 7 点格挡，抽 1 张牌。', [{ mechanism: 'block', value: 7, target: 'self' }, { mechanism: 'draw', value: 1, target: 'self' }], `${options.theme} memory shield`),
  ];

  const strike = cards[0];
  const guard = cards[1];

  const extras: CardDefinition[] = [
    card(`${prefix}_heavy`, '沉重一击', classId, 'attack', 2, 'common', '造成 14 点伤害。', [{ mechanism: 'damage', value: 14, target: 'enemy' }], `${options.theme} heavy blow`),
    card(`${prefix}_wall`, '铁壁', classId, 'defense', 2, 'common', '获得 12 点格挡。', [{ mechanism: 'block', value: 12, target: 'self' }], `${options.theme} iron wall`),
    card(`${prefix}_focus`, '集中', classId, 'skill', 1, 'common', '抽 1 张牌。', [{ mechanism: 'draw', value: 1, target: 'self' }], `${options.theme} focus skill`),
    card(`${prefix}_adrenaline`, '应激', classId, 'skill', 1, 'uncommon', '获得 1 点能量。', [{ mechanism: 'gainEnergy', value: 1, target: 'self' }], `${options.theme} adrenaline`),
    card(`${prefix}_vuln`, '暴露弱点', classId, 'skill', 1, 'uncommon', '施加 2 层易伤。', [{ mechanism: 'applyVulnerable', value: 2, target: 'enemy' }], `${options.theme} vulnerable`),
    card(`${prefix}_weak`, '扰乱', classId, 'skill', 1, 'uncommon', '施加 2 层虚弱。', [{ mechanism: 'applyWeak', value: 2, target: 'enemy' }], `${options.theme} weak debuff`),
    card(`${prefix}_heal`, '忆疗', classId, 'skill', 1, 'uncommon', '回复 4 点生命。', [{ mechanism: 'heal', value: 4, target: 'self' }], `${options.theme} heal`),
    card(`${prefix}_str`, '力量觉醒', classId, 'skill', 2, 'rare', '获得 2 点力量。', [{ mechanism: 'gainStrength', value: 2, target: 'self' }], `${options.theme} strength buff`),
    card(`${prefix}_finisher`, '终结', classId, 'attack', 2, 'rare', '造成 18 点伤害。', [{ mechanism: 'damage', value: 18, target: 'enemy' }], `${options.theme} finisher`),
    card(`${prefix}_poison`, '蚀忆', classId, 'skill', 1, 'common', '施加 3 层中毒。', [{ mechanism: 'applyPoison', value: 3, target: 'enemy' }], `${options.theme} poison`),
  ];

  while (cards.length + extras.length < count) {
    const n = cards.length + extras.length;
    extras.push(
      card(
        `${prefix}_extra_${n}`,
        `衍生${n}`,
        classId,
        n % 2 === 0 ? 'attack' : 'defense',
        1,
        'common',
        n % 2 === 0 ? '造成 7 点伤害。' : '获得 6 点格挡。',
        n % 2 === 0
          ? [{ mechanism: 'damage', value: 7, target: 'enemy' }]
          : [{ mechanism: 'block', value: 6, target: 'self' }],
        `${options.theme} extra card ${n}`
      )
    );
  }

  const allCards = [...cards, ...extras.slice(0, count - cards.length)];

  const starterDeck = [
    strike.id,
    strike.id,
    strike.id,
    strike.id,
    guard.id,
    guard.id,
    guard.id,
    guard.id,
    cards[2].id,
    cards[3].id,
  ];

  const classDef: ClassDefinition = {
    id: classId,
    name: displayName,
    description: `以「${options.theme}」为主题的 AI 生成流派（模板）。`,
    maxHp: 72,
    startingGold: 99,
    starterDeck,
    recommendedRelics: [...options.relicIds],
    imagePrompt: `${options.theme} adventurer, memory dungeon theme, roguelike hero`,
    styleTags: ['dark_fairy_tale'],
  };

  return {
    class: classDef,
    cards: allCards,
    recommendedRelics: [...options.relicIds],
  };
}
