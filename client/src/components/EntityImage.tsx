import type { ReactNode } from 'react';
import { getImageUrl } from '../api/gameApi';
import { useImageAssets } from '../context/ImageAssetContext';
import type { ImageEntityType } from '@rcb/shared';

interface EntityImageProps {
  entityType: ImageEntityType;
  entityId: string;
  /** 实体数据里自带的 imagePath（API 已合并注册表） */
  imagePath?: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}

export function EntityImage({
  entityType,
  entityId,
  imagePath,
  alt,
  className = '',
  fallback,
}: EntityImageProps) {
  const { getImagePath } = useImageAssets();
  const resolved = imagePath ?? getImagePath(entityType, entityId);
  const src = getImageUrl(resolved);

  if (!resolved && fallback) {
    return <>{fallback}</>;
  }

  return (
    <img
      className={`entity-image ${className}`.trim()}
      src={src}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).src = getImageUrl(undefined);
      }}
    />
  );
}
