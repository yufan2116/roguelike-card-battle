import { BattleAnimationLayer } from '../BattleAnimationLayer';
import type { EnemyPortraitSize } from '../AnimatedCombatant';

/** 特效层 — 飘字、飞牌、全屏闪等 */
export function EffectLayer({ enemySize }: { enemySize: EnemyPortraitSize }) {
  return (
    <div className="battle-layer effect-layer">
      <BattleAnimationLayer enemySize={enemySize} />
    </div>
  );
}
