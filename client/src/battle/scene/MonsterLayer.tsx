import { motion } from 'framer-motion';
import { getImageUrl } from '../../api/gameApi';
import type { MonsterAssetMode } from '@rcb/shared';
import type { ImageEntityType } from '@rcb/shared';
import type { CombatantAnimState } from '../BattleEventContext';
import type { EnemyPortraitSize } from '../AnimatedCombatant';

const monsterVariants = {
  idle: { scale: 1, rotate: 0, x: 0, y: 0, filter: 'brightness(1)' },
  hit: {
    x: 32,
    y: 8,
    rotate: -10,
    scale: 0.94,
    transition: { duration: 0.18, ease: 'easeOut' as const },
  },
  windup: {
    scale: 1.08,
    y: -10,
    filter: 'brightness(1.25) drop-shadow(0 0 20px rgba(255,80,80,0.85))',
    transition: { duration: 0.3 },
  },
  attack: {
    x: -52,
    y: 6,
    scale: 1.06,
    transition: { duration: 0.22, ease: 'easeIn' as const },
  },
  phase_change: {
    scale: 1.14,
    rotate: [0, -4, 4, 0],
    transition: { duration: 0.6 },
  },
};

interface MonsterLayerProps {
  portrait: string;
  mode: MonsterAssetMode;
  anim: CombatantAnimState;
  isBoss: boolean;
  enemySize: EnemyPortraitSize;
  blink: boolean;
  entityId: string;
  entityType: ImageEntityType;
}

/** 怪物立绘层 — 仅 portrait 参与动画 */
export function MonsterLayer({
  portrait,
  mode,
  anim,
  isBoss,
  enemySize,
  blink,
  entityId,
  entityType,
}: MonsterLayerProps) {
  const idleClass = isBoss ? 'boss-idle' : 'enemy-idle';
  const src = portrait ? getImageUrl(portrait) : getImageUrl(undefined);

  return (
    <div className={`battle-layer monster-layer enemy-size-${enemySize}`}>
      <motion.div
        className={[
          'monster-portrait-wrap',
          anim === 'idle' ? idleClass : '',
          blink ? 'eye-blink' : '',
          mode === 'legacy' ? 'monster-portrait-wrap--legacy' : 'monster-portrait-wrap--split',
        ]
          .filter(Boolean)
          .join(' ')}
        animate={anim}
        variants={monsterVariants}
        initial="idle"
        data-entity-id={entityId}
        data-entity-type={entityType}
      >
        <div className="monster-portrait-shadow" aria-hidden />
        <div className="monster-portrait-frame">
          {portrait ? (
            <img
              className="monster-portrait-img"
              src={src}
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl(undefined);
              }}
            />
          ) : (
            <span className="sprite-icon">{isBoss ? '👁' : '💀'}</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
