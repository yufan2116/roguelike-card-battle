import type { NodeType } from '../types/game.js';
import type { ResolvedMonsterAsset } from './monsterAsset.js';

/** 敌人战斗立绘资源（表现层） */
export interface EnemyBattleAssets {
  portrait: string;
  background?: string;
}

/** 遭遇战视觉配置（表现层，不写入战斗引擎） */
export interface BattleEncounterVisuals {
  background?: string;
}

export const DEFAULT_BATTLE_BACKGROUND = '';

export function resolveEnemyBattleAssets(
  monster: ResolvedMonsterAsset,
  legacyImagePath?: string
): EnemyBattleAssets {
  const portrait = monster.portrait || legacyImagePath || '';
  if (monster.background) {
    return { portrait, background: monster.background };
  }
  return { portrait };
}

/** 背景优先级：encounter.background > assets.background > 默认 CSS */
export function resolveEncounterBackground(
  encounterBackground?: string,
  assetBackground?: string,
  _nodeType?: NodeType
): string {
  if (encounterBackground?.trim()) return encounterBackground;
  if (assetBackground?.trim()) return assetBackground;
  return DEFAULT_BATTLE_BACKGROUND;
}
