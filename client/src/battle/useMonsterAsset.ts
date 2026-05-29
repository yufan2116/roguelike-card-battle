import { useMemo } from 'react';
import type { ImageEntityType } from '@rcb/shared';
import { resolveMonsterAsset } from '@rcb/shared';
import { useImageAssets } from '../context/ImageAssetContext';

export function useMonsterAsset(
  entityType: ImageEntityType,
  entityId: string,
  legacyImagePath?: string
) {
  const { registry } = useImageAssets();

  return useMemo(() => {
    const record = registry?.records.find(
      (r) => r.entityType === entityType && r.entityId === entityId
    );
    return resolveMonsterAsset(record, legacyImagePath);
  }, [registry, entityType, entityId, legacyImagePath]);
}
