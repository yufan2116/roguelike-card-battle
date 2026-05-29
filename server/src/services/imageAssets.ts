import {
  ART_STYLE_PRESETS,
  buildGameAssetPrompt,
  createEventId,
  resolveMonsterAsset,
  type ArtStylePreset,
  type ImageAssetRole,
  type ImageAssetsRegistry,
  type ImageAssetRecord,
  type ImageEntityType,
  type ResolvedMonsterAsset,
  type ImageGenerationSpec,
} from '@rcb/shared';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from './storage.js';
import { resolveEntityDefinition } from './entityResolver.js';

const REGISTRY_FILE = 'imageAssets.json';

let registryCache: ImageAssetsRegistry | null = null;
let registryCacheMtime: number | null = null;

function registryFilePath(): string {
  return path.join(config.dataDir, REGISTRY_FILE);
}

function defaultRegistry(): ImageAssetsRegistry {
  return { globalPreset: 'dark_fairy_tale', records: [] };
}

export async function loadImageRegistry(): Promise<ImageAssetsRegistry> {
  let mtime = 0;
  try {
    const stat = await fs.stat(registryFilePath());
    mtime = stat.mtimeMs;
  } catch {
    /* registry file may not exist yet */
  }

  if (registryCache && registryCacheMtime === mtime) {
    return registryCache;
  }

  try {
    registryCache = await readJsonFile<ImageAssetsRegistry>(REGISTRY_FILE);
    if (!registryCache.records) registryCache.records = [];
    if (!registryCache.globalPreset) registryCache.globalPreset = 'dark_fairy_tale';
  } catch {
    registryCache = defaultRegistry();
    await saveImageRegistry(registryCache);
    return registryCache;
  }

  registryCacheMtime = mtime;
  return registryCache;
}

export async function saveImageRegistry(registry: ImageAssetsRegistry): Promise<void> {
  registryCache = registry;
  await writeJsonFile(REGISTRY_FILE, registry);
  try {
    const stat = await fs.stat(registryFilePath());
    registryCacheMtime = stat.mtimeMs;
  } catch {
    registryCacheMtime = null;
  }
}

export function invalidateImageRegistryCache(): void {
  registryCache = null;
  registryCacheMtime = null;
}

export async function getImageRecord(
  entityType: ImageEntityType,
  entityId: string
): Promise<ImageAssetRecord | null> {
  const registry = await loadImageRegistry();
  return (
    registry.records.find((r) => r.entityType === entityType && r.entityId === entityId) ?? null
  );
}

export async function resolveActiveImagePath(
  entityType: ImageEntityType,
  entityId: string
): Promise<string | undefined> {
  const record = await getImageRecord(entityType, entityId);
  if (!record?.activeVariantId) return undefined;
  const variant = record.variants.find((v) => v.id === record.activeVariantId);
  return variant?.imagePath;
}

export async function setGlobalPreset(preset: ArtStylePreset): Promise<ImageAssetsRegistry> {
  const registry = await loadImageRegistry();
  registry.globalPreset = preset;
  await saveImageRegistry(registry);
  return registry;
}

export async function setActiveVariant(
  entityType: ImageEntityType,
  entityId: string,
  variantId: string
): Promise<ImageAssetRecord> {
  const registry = await loadImageRegistry();
  const record = registry.records.find(
    (r) => r.entityType === entityType && r.entityId === entityId
  );
  if (!record) throw new Error('Asset record not found');
  const variant = record.variants.find((v) => v.id === variantId);
  if (!variant) throw new Error('Variant not found');
  record.activeVariantId = variantId;
  await saveImageRegistry(registry);
  return record;
}

export interface GenerateImageResult {
  record: ImageAssetRecord;
  variantId: string;
  imagePath: string;
  usedFallback: boolean;
  prompt: string;
}

export async function resolveMonsterAssetForEntity(
  entityType: ImageEntityType,
  entityId: string,
  legacyImagePath?: string
): Promise<ResolvedMonsterAsset> {
  const record = await getImageRecord(entityType, entityId);
  return resolveMonsterAsset(record, legacyImagePath);
}

export async function generateAndRegisterImage(options: {
  entityType: ImageEntityType;
  entityId: string;
  preset: ArtStylePreset;
  customPrompt?: string;
  assetRole?: ImageAssetRole;
  /** 为 true 时 API 失败直接抛错，不写入 SVG 占位 */
  strict?: boolean;
}): Promise<GenerateImageResult> {
  const entity = await resolveEntityDefinition(options.entityType, options.entityId);
  if (!entity) throw new Error(`Entity not found: ${options.entityType}/${options.entityId}`);

  const role = options.assetRole ?? 'combined';
  const isMonster = options.entityType === 'enemy' || options.entityType === 'boss';
  const isBoss = options.entityType === 'boss' || (entity.subLabel === 'Boss');

  const { prompt, spec } = buildGameAssetPrompt(
    entity.imagePrompt,
    options.entityType,
    options.preset,
    {
      customPrompt: options.customPrompt,
      assetRole: isMonster ? role : 'combined',
      isBoss,
    }
  );

  const variantId = createEventId().replace('evt_', 'var_');
  const subDir =
    isMonster && role !== 'combined'
      ? path.join('generated', options.entityType, options.entityId, role)
      : path.join('generated', options.entityType, options.entityId);
  const absDir = path.join(config.assetsDir, subDir);
  await fs.mkdir(absDir, { recursive: true });

  const { relativePath, usedFallback } = await generateImageFile(
    prompt,
    absDir,
    variantId,
    entity.name,
    spec,
    options.strict
  );

  const variant = {
    id: variantId,
    preset: options.preset,
    customPrompt: options.customPrompt?.trim() ?? '',
    imagePath: relativePath.replace(/\\/g, '/'),
    createdAt: new Date().toISOString(),
    role: isMonster ? role : undefined,
  };

  const registry = await loadImageRegistry();
  let record = registry.records.find(
    (r) => r.entityType === options.entityType && r.entityId === options.entityId
  );

  if (!record) {
    record = {
      entityType: options.entityType,
      entityId: options.entityId,
      variants: [],
      activeVariantId: null,
    };
    registry.records.push(record);
  }

  record.variants.push(variant);

  if (isMonster && role === 'portrait') {
    record.monsterLayer = {
      portraitVariantId: variantId,
      backgroundVariantId: record.monsterLayer?.backgroundVariantId ?? null,
    };
    record.activeVariantId = variantId;
  } else if (isMonster && role === 'background') {
    record.monsterLayer = {
      portraitVariantId: record.monsterLayer?.portraitVariantId ?? null,
      backgroundVariantId: variantId,
    };
  } else {
    record.activeVariantId = variantId;
  }

  await saveImageRegistry(registry);

  return {
    record,
    variantId,
    imagePath: variant.imagePath,
    usedFallback,
    prompt,
  };
}

async function generateImageFile(
  prompt: string,
  absDir: string,
  variantId: string,
  entityName: string,
  spec: ImageGenerationSpec,
  strict = false
): Promise<{ relativePath: string; usedFallback: boolean }> {
  if (config.imageApiKey) {
    try {
      const pngPath = path.join(absDir, `${variantId}.png`);
      let buffer = await callExternalImageApi(prompt, spec.apiSize);
      buffer = await resizeToTarget(buffer, spec.targetWidth, spec.targetHeight);
      await fs.writeFile(pngPath, buffer);
      const relFromAssets = path.relative(config.assetsDir, pngPath).replace(/\\/g, '/');
      return { relativePath: relFromAssets, usedFallback: false };
    } catch (err) {
      if (strict) throw err;
      console.warn('[ImageService] API failed, using SVG fallback:', err);
    }
  } else if (strict) {
    throw new Error('IMAGE_API_KEY not configured');
  }

  const svgPath = path.join(absDir, `${variantId}.svg`);
  const svg = buildFallbackSvg(entityName, prompt, spec.targetWidth, spec.targetHeight);
  await fs.writeFile(svgPath, svg, 'utf-8');
  const relFromAssets = path.relative(config.assetsDir, svgPath).replace(/\\/g, '/');
  return { relativePath: relFromAssets, usedFallback: true };
}

async function callExternalImageApi(prompt: string, apiSize: string): Promise<Buffer> {
  const isGptImageModel = config.imageModel.startsWith('gpt-image');
  const body: Record<string, unknown> = {
    model: config.imageModel,
    prompt,
    n: 1,
    size: apiSize,
  };
  if (!isGptImageModel) {
    body.response_format = 'b64_json';
  }

  const maxAttempts = 4;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(config.imageApiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.imageApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        const retryable = res.status === 429 || res.status >= 500;
        const err = new Error(`Image API error ${res.status}: ${text.slice(0, 200)}`);
        if (retryable && attempt < maxAttempts) {
          lastError = err;
          await sleepMs(1500 * attempt);
          continue;
        }
        throw err;
      }

      const data = (await res.json()) as {
        data?: Array<{ b64_json?: string; url?: string }>;
      };

      const item = data.data?.[0];
      if (item?.b64_json) {
        return Buffer.from(item.b64_json, 'base64');
      }

      if (item?.url) {
        const imgRes = await fetch(item.url);
        if (!imgRes.ok) throw new Error('Failed to download generated image');
        return Buffer.from(await imgRes.arrayBuffer());
      }

      throw new Error('Image API returned no image data');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        await sleepMs(1500 * attempt);
        continue;
      }
    }
  }

  throw lastError ?? new Error('Image API failed after retries');
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function buildFallbackSvg(
  name: string,
  prompt: string,
  width = 512,
  height = 512
): string {
  const h = hashString(prompt);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40) % 360;
  const safeName = name.replace(/[<>&"']/g, '');
  const shortPrompt = prompt.slice(0, 80).replace(/[<>&"']/g, '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue1},45%,22%)"/>
      <stop offset="100%" style="stop-color:hsl(${hue2},55%,12%)"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${width / 2}" cy="${height * 0.38}" r="${Math.min(width, height) * 0.14}" fill="hsl(${hue1},50%,35%)" opacity="0.6"/>
  <text x="${width / 2}" y="${height * 0.66}" text-anchor="middle" fill="#e8dcc8" font-family="serif" font-size="${Math.max(14, width * 0.055)}" font-weight="bold">${safeName}</text>
  <text x="${width / 2}" y="${height * 0.74}" text-anchor="middle" fill="#a89880" font-family="sans-serif" font-size="${Math.max(10, width * 0.023)}">Game Asset Placeholder</text>
  <text x="${width / 2}" y="${height * 0.82}" text-anchor="middle" fill="#807060" font-family="sans-serif" font-size="${Math.max(8, width * 0.02)}">${shortPrompt}</text>
</svg>`;
}

/** 将 API 输出缩放到目标游戏资产尺寸（PNG） */
async function resizeToTarget(
  buffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    return sharp(buffer)
      .resize(targetWidth, targetHeight, { fit: 'cover', position: 'centre' })
      .png({ compressionLevel: 9 })
      .toBuffer();
  } catch {
    // sharp 未安装时保留 API 原始尺寸
    return buffer;
  }
}

export function getStylePresets() {
  return Object.entries(ART_STYLE_PRESETS).map(([id, meta]) => ({
    id,
    label: meta.label,
    promptSuffix: meta.promptSuffix,
  }));
}

export async function listAllImageRecords(): Promise<ImageAssetRecord[]> {
  const registry = await loadImageRegistry();
  return registry.records;
}
