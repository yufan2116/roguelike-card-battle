import type { MetaProgress } from '../types/game.js';

export type MetaUpgradeId = 'max_hp' | 'starting_gold' | 'extra_choice' | 'relic_pool';

export interface MetaUpgradeDefinition {
  id: MetaUpgradeId;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  /** 每级效果说明 */
  effectLabel: string;
}

export const META_UPGRADE_CATALOG: MetaUpgradeDefinition[] = [
  {
    id: 'max_hp',
    name: '残忆体魄',
    description: '永久提升新 run 的起始生命',
    cost: 50,
    maxLevel: 5,
    effectLabel: '起始生命 +5',
  },
  {
    id: 'starting_gold',
    name: '残忆金袋',
    description: '永久提升新 run 的起始金币',
    cost: 40,
    maxLevel: 5,
    effectLabel: '起始金币 +15',
  },
  {
    id: 'extra_choice',
    name: '残忆抉择',
    description: '战斗胜利后奖励卡牌多 1 选',
    cost: 80,
    maxLevel: 2,
    effectLabel: '奖励 +1 选',
  },
  {
    id: 'relic_pool',
    name: '残忆遗物库',
    description: '解锁更多随机遗物进入宝箱/商店池',
    cost: 60,
    maxLevel: 3,
    effectLabel: '解锁 1 件额外遗物',
  },
];

/** 遗物 ID，按 meta 等级逐步解锁 */
export const META_RELIC_UNLOCK_ORDER = [
  'demon_dice',
  'ash_pendant',
  'memory_shard',
];

export function getUpgradeLevel(meta: MetaProgress, upgradeId: MetaUpgradeId): number {
  switch (upgradeId) {
    case 'max_hp':
      return Math.floor(meta.upgrades.bonusMaxHp / 5);
    case 'starting_gold':
      return Math.floor(meta.upgrades.bonusStartingGold / 15);
    case 'extra_choice':
      return meta.upgrades.extraCardChoices;
    case 'relic_pool':
      return meta.upgrades.unlockedRelicPool.length;
    default:
      return 0;
  }
}

export function getUpgradeCost(def: MetaUpgradeDefinition, currentLevel: number): number {
  return def.cost + currentLevel * Math.floor(def.cost * 0.4);
}

export function canPurchaseUpgrade(
  meta: MetaProgress,
  upgradeId: MetaUpgradeId
): { ok: boolean; reason?: string; cost?: number } {
  const def = META_UPGRADE_CATALOG.find((u) => u.id === upgradeId);
  if (!def) return { ok: false, reason: '未知升级' };

  const level = getUpgradeLevel(meta, upgradeId);
  if (level >= def.maxLevel) return { ok: false, reason: '已达最高等级' };

  const cost = getUpgradeCost(def, level);
  if (meta.souls < cost) return { ok: false, reason: `灵魂不足（需要 ${cost}）`, cost };

  return { ok: true, cost };
}

export function purchaseMetaUpgrade(
  meta: MetaProgress,
  upgradeId: MetaUpgradeId
): { meta: MetaProgress; message: string } {
  const check = canPurchaseUpgrade(meta, upgradeId);
  if (!check.ok || check.cost === undefined) {
    throw new Error(check.reason ?? '无法购买');
  }

  const def = META_UPGRADE_CATALOG.find((u) => u.id === upgradeId)!;
  const upgrades = { ...meta.upgrades, unlockedClasses: [...meta.upgrades.unlockedClasses] };

  switch (upgradeId) {
    case 'max_hp':
      upgrades.bonusMaxHp += 5;
      break;
    case 'starting_gold':
      upgrades.bonusStartingGold += 15;
      break;
    case 'extra_choice':
      upgrades.extraCardChoices += 1;
      break;
    case 'relic_pool': {
      const nextRelic = META_RELIC_UNLOCK_ORDER.find(
        (id) => !upgrades.unlockedRelicPool.includes(id)
      );
      if (!nextRelic) throw new Error('遗物池已全部解锁');
      upgrades.unlockedRelicPool = [...upgrades.unlockedRelicPool, nextRelic];
      break;
    }
  }

  return {
    meta: {
      ...meta,
      souls: meta.souls - check.cost,
      upgrades,
    },
    message: `已升级「${def.name}」至 Lv.${getUpgradeLevel({ ...meta, upgrades }, upgradeId)}`,
  };
}

export interface SaveSlotSummary {
  runId: string;
  seed: string;
  classId: string;
  className?: string;
  phase: string;
  floor: number;
  currentHp: number;
  maxHp: number;
  gold: number;
  relicCount: number;
  deckSize: number;
  updatedAt: string;
  createdAt: string;
  /** 可继续游戏 */
  continuable: boolean;
}

export function isRunContinuable(phase: string): boolean {
  return phase !== 'victory' && phase !== 'defeat';
}

export const LAST_RUN_STORAGE_KEY = 'rcb_last_run_id';
