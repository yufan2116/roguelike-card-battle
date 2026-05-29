import type { ImageAssetRecord } from '../types/game.js';

/** 怪物战斗分层资源：立绘与背景分离 */
export interface MonsterAsset {
  portrait: string;
  background: string;
}

export type MonsterAssetMode = 'split' | 'legacy';

export interface ResolvedMonsterAsset extends MonsterAsset {
  mode: MonsterAssetMode;
}

const DEFAULT_BG = '';

function variantPath(record: ImageAssetRecord, variantId: string | null | undefined): string {
  if (!variantId) return '';
  return record.variants.find((v) => v.id === variantId)?.imagePath ?? '';
}

function latestRolePath(record: ImageAssetRecord, role: 'portrait' | 'background'): string {
  for (let i = record.variants.length - 1; i >= 0; i--) {
    const v = record.variants[i];
    if (v.role === role) return v.imagePath;
  }
  return '';
}

/**
 * 从图片注册表解析怪物分层资源。
 * - split: 独立 portrait + background 变体
 * - legacy: portrait 复用旧的全图，background 为空（由 CSS 兜底）
 */
export function resolveMonsterAsset(
  record: ImageAssetRecord | null | undefined,
  legacyImagePath?: string
): ResolvedMonsterAsset {
  if (record) {
    const binding = record.monsterLayer;
    if (binding?.portraitVariantId && binding?.backgroundVariantId) {
      const portrait = variantPath(record, binding.portraitVariantId);
      const background = variantPath(record, binding.backgroundVariantId);
      if (portrait && background) {
        return { portrait, background, mode: 'split' };
      }
    }

    const rolePortrait = latestRolePath(record, 'portrait');
    const roleBackground = latestRolePath(record, 'background');
    if (rolePortrait && roleBackground) {
      return { portrait: rolePortrait, background: roleBackground, mode: 'split' };
    }
  }

  const legacyPortrait =
    legacyImagePath ??
    (record?.activeVariantId
      ? variantPath(record, record.activeVariantId)
      : record?.variants.at(-1)?.imagePath ?? '');

  const partialBackground = record ? latestRolePath(record, 'background') : '';

  return {
    portrait: legacyPortrait,
    background: partialBackground || DEFAULT_BG,
    mode: 'legacy',
  };
}
