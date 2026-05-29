import type { ImageAssetRole, ImageEntityType } from '../types/game.js';

/** 轻量游戏资产基础风格（所有生成任务共用） */
export const GAME_ASSET_BASE_STYLE =
  'dark fantasy storybook game asset, clean silhouette, simple shading, readable shape, low detail, stylized, transparent background, no environment';

/** 负面约束 — 避免电影感 / 超写实 */
export const GAME_ASSET_AVOID_TERMS =
  'avoid ultra detailed, cinematic, 8k, photorealistic, complex background, tiny details, no text, no watermark, no logo';

export type ImageGenerationCategory =
  | 'monster_portrait'
  | 'boss_portrait'
  | 'card_art'
  | 'battle_background'
  | 'relic_icon'
  | 'avatar'
  | 'legacy_combined';

export interface ImageGenerationSpec {
  category: ImageGenerationCategory;
  /** 实体类型专用 prompt 片段 */
  promptHints: string;
  targetWidth: number;
  targetHeight: number;
  /** 发给图片 API 的尺寸（生成后缩放到 target） */
  apiSize: string;
}

const MONSTER_PORTRAIT_HINTS =
  'transparent background, full body, centered character, no scenery, no frame, no floor, isolated sprite';

const BOSS_PORTRAIT_HINTS =
  'transparent background, full body, centered boss character, imposing silhouette, no scenery, no frame, no floor';

const BATTLE_BACKGROUND_HINTS =
  'background only, no characters, no creatures, empty dungeon scene, 16:9 aspect ratio, environment plate';

const CARD_ART_HINTS =
  'single card illustration, centered subject, simple composition, game card art, no card frame border';

const RELIC_ICON_HINTS =
  'single relic item icon, centered, simple icon composition, game inventory icon';

const AVATAR_HINTS =
  'character bust portrait, centered, simple avatar icon, circular crop friendly';

const LEGACY_COMBINED_HINTS =
  'game character or creature sprite, centered, simple composition';

export const IMAGE_GENERATION_SIZES: Record<
  ImageGenerationCategory,
  Pick<ImageGenerationSpec, 'targetWidth' | 'targetHeight' | 'apiSize'>
> = {
  monster_portrait: { targetWidth: 512, targetHeight: 768, apiSize: '1024x1536' },
  boss_portrait: { targetWidth: 768, targetHeight: 1024, apiSize: '1024x1536' },
  card_art: { targetWidth: 512, targetHeight: 512, apiSize: '1024x1024' },
  battle_background: { targetWidth: 1024, targetHeight: 576, apiSize: '1536x1024' },
  relic_icon: { targetWidth: 256, targetHeight: 256, apiSize: '1024x1024' },
  avatar: { targetWidth: 256, targetHeight: 256, apiSize: '1024x1024' },
  legacy_combined: { targetWidth: 512, targetHeight: 512, apiSize: '1024x1024' },
};

export function resolveImageGenerationSpec(
  entityType: ImageEntityType,
  assetRole: ImageAssetRole = 'combined',
  isBoss = false
): ImageGenerationSpec {
  if (entityType === 'enemy' || entityType === 'boss') {
    if (assetRole === 'background') {
      return spec('battle_background', BATTLE_BACKGROUND_HINTS);
    }
    if (entityType === 'boss' || isBoss) {
      return spec('boss_portrait', BOSS_PORTRAIT_HINTS);
    }
    return spec('monster_portrait', MONSTER_PORTRAIT_HINTS);
  }

  switch (entityType) {
    case 'card':
      return spec('card_art', CARD_ART_HINTS);
    case 'relic':
      return spec('relic_icon', RELIC_ICON_HINTS);
    case 'class':
      return spec('avatar', AVATAR_HINTS);
    default:
      return spec('legacy_combined', LEGACY_COMBINED_HINTS);
  }
}

function spec(category: ImageGenerationCategory, promptHints: string): ImageGenerationSpec {
  const sizes = IMAGE_GENERATION_SIZES[category];
  return { category, promptHints, ...sizes };
}
