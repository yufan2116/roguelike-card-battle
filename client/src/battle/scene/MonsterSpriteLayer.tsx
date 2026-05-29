import { motion } from 'framer-motion';
import { getImageUrl } from '../../api/gameApi';
import type { MonsterAssetMode } from '@rcb/shared';
import type { ImageEntityType } from '@rcb/shared';
import type { CombatantAnimState } from '../BattleEventContext';
import type { EnemyPortraitSize } from '../AnimatedCombatant';

const monsterVariants = {
  idle: { scale: 1, rotate: 0, x: 0, y: 0, filter: 'brightness(1)' },
  hit: {
    x: 36,
    y: 10,
    rotate: -10,
    scale: 0.92,
    transition: { duration: 0.18, ease: 'easeOut' as const },
  },
  windup: {
    scale: 1.08,
    y: -12,
    filter: 'brightness(1.25) drop-shadow(0 0 24px rgba(255,80,80,0.85))',
    transition: { duration: 0.3 },
  },
  attack: {
    x: -56,
    y: 8,
    scale: 1.06,
    transition: { duration: 0.22, ease: 'easeIn' as const },
  },
  phase_change: {
    scale: 1.14,
    rotate: [0, -4, 4, 0],
    transition: { duration: 0.6 },
  },
};

interface MonsterSpriteLayerProps {
  portrait: string;
  mode: MonsterAssetMode;
  anim: CombatantAnimState;
  isBoss: boolean;
  enemySize: EnemyPortraitSize;
  blink: boolean;
  entityId: string;
  entityType: ImageEntityType;
}

/** 透明立绘层 — 仅 portrait 参与 idle / hit 动画 */
export function MonsterSpriteLayer({
  portrait,
  mode,
  anim,
  isBoss,
  enemySize,
  blink,
  entityId,
  entityType,
}: MonsterSpriteLayerProps) {
  const idleClass = isBoss ? 'boss-idle' : 'enemy-idle';
  const src = portrait ? getImageUrl(portrait) : getImageUrl(undefined);

  return (
    <div className={`monster-sprite-layer enemy-size-${enemySize}`}>
      <motion.div
        className={[
          'monster-sprite',
          anim === 'idle' ? idleClass : '',
          blink ? 'eye-blink' : '',
          mode === 'legacy' ? 'monster-sprite--legacy' : 'monster-sprite--split',
        ]
          .filter(Boolean)
          .join(' ')}
        animate={anim}
        variants={monsterVariants}
        initial="idle"
        data-entity-id={entityId}
        data-entity-type={entityType}
      >
        <div className="monster-sprite__shadow" aria-hidden />
        <div className="monster-sprite__frame">
          {portrait ? (
            <img
              className="monster-sprite__img"
              src={src}
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl(undefined);
              }}
            />
          ) : (
            <span className="monster-sprite__fallback">{isBoss ? '👁' : '💀'}</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
