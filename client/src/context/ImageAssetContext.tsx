import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ArtStylePreset, ImageAssetsRegistry, ImageEntityType, ResolvedMonsterAsset } from '@rcb/shared';
import { resolveMonsterAsset } from '@rcb/shared';
import {
  fetchImagePresets,
  fetchImageRegistry,
  fetchImageStatus,
  type StylePresetInfo,
} from '../api/imageApi';

interface ImageAssetContextValue {
  registry: ImageAssetsRegistry | null;
  presets: StylePresetInfo[];
  hasApiKey: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  getImagePath: (entityType: ImageEntityType, entityId: string) => string | undefined;
  getMonsterAsset: (
    entityType: ImageEntityType,
    entityId: string,
    legacyPath?: string
  ) => ResolvedMonsterAsset;
}

const ImageAssetContext = createContext<ImageAssetContextValue | null>(null);

export function ImageAssetProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<ImageAssetsRegistry | null>(null);
  const [presets, setPresets] = useState<StylePresetInfo[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [reg, presetList, status] = await Promise.all([
      fetchImageRegistry(),
      fetchImagePresets(),
      fetchImageStatus(),
    ]);
    setRegistry(reg);
    setPresets(presetList);
    setHasApiKey(status.hasApiKey);
  }, []);

  useEffect(() => {
    refresh()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refresh]);

  const pathMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!registry) return map;
    for (const record of registry.records) {
      if (!record.activeVariantId) continue;
      const variant = record.variants.find((v) => v.id === record.activeVariantId);
      if (variant) {
        map.set(`${record.entityType}:${record.entityId}`, variant.imagePath);
      }
    }
    return map;
  }, [registry]);

  const getImagePath = useCallback(
    (entityType: ImageEntityType, entityId: string) =>
      pathMap.get(`${entityType}:${entityId}`),
    [pathMap]
  );

  const getMonsterAsset = useCallback(
    (entityType: ImageEntityType, entityId: string, legacyPath?: string) => {
      const record = registry?.records.find(
        (r) => r.entityType === entityType && r.entityId === entityId
      );
      return resolveMonsterAsset(record, legacyPath);
    },
    [registry]
  );

  return (
    <ImageAssetContext.Provider
      value={{ registry, presets, hasApiKey, loading, refresh, getImagePath, getMonsterAsset }}
    >
      {children}
    </ImageAssetContext.Provider>
  );
}

export function useImageAssets() {
  const ctx = useContext(ImageAssetContext);
  if (!ctx) throw new Error('useImageAssets must be used within ImageAssetProvider');
  return ctx;
}

export function useGlobalPreset(): ArtStylePreset {
  const { registry } = useImageAssets();
  return registry?.globalPreset ?? 'dark_fairy_tale';
}
