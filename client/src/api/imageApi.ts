import type {
  ArtStylePreset,
  ImageAssetRecord,
  ImageAssetsRegistry,
  ImageEntityType,
} from '@rcb/shared';

const API_BASE = '/api/images';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export interface StylePresetInfo {
  id: ArtStylePreset;
  label: string;
  promptSuffix: string;
}

export interface EntityLite {
  id: string;
  name: string;
  imagePrompt: string;
  styleTags?: string[];
  subLabel?: string;
}

export async function fetchImagePresets() {
  const data = await fetchJson<{ presets: StylePresetInfo[] }>('/presets');
  return data.presets;
}

export async function fetchImageStatus() {
  return fetchJson<{ hasApiKey: boolean; model: string; baseUrl: string }>('/status');
}

export async function fetchImageRegistry() {
  const data = await fetchJson<{ registry: ImageAssetsRegistry }>('/registry');
  return data.registry;
}

export async function fetchEntities(entityType: ImageEntityType) {
  const data = await fetchJson<{ entities: EntityLite[] }>(`/entities/${entityType}`);
  return data.entities;
}

export async function resolveEntityImage(entityType: ImageEntityType, entityId: string) {
  return fetchJson<{
    record: ImageAssetRecord | null;
    imagePath?: string;
    entity: EntityLite | null;
  }>(`/resolve/${entityType}/${entityId}`);
}

export async function generateImage(options: {
  entityType: ImageEntityType;
  entityId: string;
  preset: ArtStylePreset;
  customPrompt?: string;
}) {
  return fetchJson<{
    ok: boolean;
    record: ImageAssetRecord;
    variantId: string;
    imagePath: string;
    usedFallback: boolean;
    prompt: string;
    message: string;
  }>('/generate', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

export async function generateBatch(options: {
  entityType: ImageEntityType;
  preset: ArtStylePreset;
  customPrompt?: string;
  limit?: number;
}) {
  return fetchJson<{
    ok: boolean;
    results: Array<{
      entityId: string;
      entityName: string;
      imagePath: string;
      usedFallback: boolean;
    }>;
  }>('/generate-batch', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

export async function setActiveVariant(
  entityType: ImageEntityType,
  entityId: string,
  variantId: string
) {
  return fetchJson<{ ok: boolean; record: ImageAssetRecord }>('/active-variant', {
    method: 'POST',
    body: JSON.stringify({ entityType, entityId, variantId }),
  });
}

export async function setGlobalPreset(preset: ArtStylePreset) {
  return fetchJson<{ ok: boolean; registry: ImageAssetsRegistry }>('/global-preset', {
    method: 'POST',
    body: JSON.stringify({ preset }),
  });
}
