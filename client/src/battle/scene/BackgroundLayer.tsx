import { getImageUrl } from '../../api/gameApi';
import type { MonsterAssetMode } from '@rcb/shared';
import type { EnemyPortraitSize } from '../AnimatedCombatant';

interface BackgroundLayerProps {
  background: string;
  mode: MonsterAssetMode;
  tier: EnemyPortraitSize;
}

/** 静态战斗环境层 — 不受 idle / hit 动画影响 */
export function BackgroundLayer({ background, mode, tier }: BackgroundLayerProps) {
  const hasImage = Boolean(background);

  return (
    <div
      className={[
        'battle-layer',
        'background-layer',
        `background-layer--${tier}`,
        mode === 'legacy' ? 'background-layer--legacy' : 'background-layer--split',
      ].join(' ')}
      aria-hidden
    >
      {hasImage ? (
        <img className="background-layer__img" src={getImageUrl(background)} alt="" />
      ) : null}
      <div className="background-layer__gradient" />
      <div className="background-layer__vignette" />
    </div>
  );
}
