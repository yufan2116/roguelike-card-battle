import { useMemo } from 'react';
import type { ImageEntityType, NodeType } from '@rcb/shared';
import {
  resolveEncounterBackground,
  resolveEnemyBattleAssets,
  resolveMonsterAsset,
} from '@rcb/shared';
import { useImageAssets } from '../context/ImageAssetContext';

export function useBattlePresentation(
  entityType: ImageEntityType,
  entityId: string,
  nodeType: NodeType,
  encounterBackground?: string,
  legacyImagePath?: string
) {
  const { registry } = useImageAssets();

  return useMemo(() => {
    const record = registry?.records.find(
      (r) => r.entityType === entityType && r.entityId === entityId
    );
    const monster = resolveMonsterAsset(record, legacyImagePath);
    const assets = resolveEnemyBattleAssets(monster, legacyImagePath);
    const background = resolveEncounterBackground(
      encounterBackground,
      assets.background,
      nodeType
    );
    return { assets, background, mode: monster.mode };
  }, [registry, entityType, entityId, nodeType, encounterBackground, legacyImagePath]);
}
