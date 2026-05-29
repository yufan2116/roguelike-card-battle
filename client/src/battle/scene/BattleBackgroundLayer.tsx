import { getImageUrl } from '../../api/gameApi';
import type { EnemyPortraitSize } from '../AnimatedCombatant';

interface BattleBackgroundLayerProps {
  background: string;
  tier: EnemyPortraitSize;
}

/** 全屏静态战斗背景 — 不参与任何动画 */
export function BattleBackgroundLayer({ background, tier }: BattleBackgroundLayerProps) {
  const hasImage = Boolean(background);

  return (
    <div className={`battle-background-layer battle-background-layer--${tier}`}>
      {hasImage ? (
        <img className="battle-background-layer__img" src={getImageUrl(background)} alt="" />
      ) : null}
      <div className="battle-background-layer__fill" aria-hidden />
    </div>
  );
}
