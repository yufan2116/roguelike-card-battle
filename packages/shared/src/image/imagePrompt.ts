import {
  GAME_ASSET_AVOID_TERMS,
  GAME_ASSET_BASE_STYLE,
  resolveImageGenerationSpec,
  type ImageGenerationSpec,
} from './imageGenerationSpec.js';
import { ART_STYLE_PRESETS, type ArtStylePreset, type ImageAssetRole, type ImageEntityType } from '../types/game.js';

/** 组装轻量游戏资产 Prompt */
export function buildGameAssetPrompt(
  basePrompt: string,
  entityType: ImageEntityType,
  preset: ArtStylePreset,
  options?: {
    customPrompt?: string;
    assetRole?: ImageAssetRole;
    isBoss?: boolean;
  }
): { prompt: string; spec: ImageGenerationSpec } {
  const role = options?.assetRole ?? 'combined';
  const spec = resolveImageGenerationSpec(entityType, role, options?.isBoss ?? entityType === 'boss');

  const presetHint = ART_STYLE_PRESETS[preset].promptSuffix;

  const parts = [
    basePrompt.trim(),
    spec.promptHints,
    GAME_ASSET_BASE_STYLE,
    presetHint,
    options?.customPrompt?.trim(),
    'fantasy roguelike card battle game',
    GAME_ASSET_AVOID_TERMS,
  ].filter(Boolean);

  return { prompt: parts.join(', '), spec };
}

/** @deprecated 使用 buildGameAssetPrompt */
export function buildImagePrompt(
  basePrompt: string,
  entityType: ImageEntityType,
  preset: ArtStylePreset,
  customPrompt?: string
): string {
  return buildGameAssetPrompt(basePrompt, entityType, preset, { customPrompt }).prompt;
}

/** @deprecated 使用 buildGameAssetPrompt */
export function buildMonsterPortraitPrompt(
  basePrompt: string,
  entityType: 'enemy' | 'boss',
  preset: ArtStylePreset,
  customPrompt?: string
): string {
  return buildGameAssetPrompt(basePrompt, entityType, preset, {
    customPrompt,
    assetRole: 'portrait',
    isBoss: entityType === 'boss',
  }).prompt;
}

/** @deprecated 使用 buildGameAssetPrompt */
export function buildMonsterBackgroundPrompt(
  basePrompt: string,
  entityType: 'enemy' | 'boss',
  preset: ArtStylePreset,
  customPrompt?: string
): string {
  return buildGameAssetPrompt(basePrompt, entityType, preset, {
    customPrompt,
    assetRole: 'background',
  }).prompt;
}

export { resolveImageGenerationSpec, IMAGE_GENERATION_SIZES, GAME_ASSET_BASE_STYLE } from './imageGenerationSpec.js';
export type { ImageGenerationSpec, ImageGenerationCategory } from './imageGenerationSpec.js';
