import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { ImageEntityType } from '@rcb/shared';
import { EntityImage } from '../components/EntityImage';
import type { CombatantAnimState } from './BattleEventContext';

export type EnemyPortraitSize = 'normal' | 'elite' | 'boss';

interface AnimatedCombatantProps {
  role: 'enemy' | 'player';
  anim: CombatantAnimState;
  isBoss?: boolean;
  enemySize?: EnemyPortraitSize;
  blink?: boolean;
  entityId?: string;
  entityType?: ImageEntityType;
  imagePath?: string;
  children?: ReactNode;
}

const enemyVariants = {
  idle: { scale: 1, rotate: 0, x: 0, y: 0, filter: 'brightness(1)' },
  hit: {
    x: 28,
    y: 6,
    rotate: -8,
    scale: 0.96,
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  windup: {
    scale: 1.08,
    y: -8,
    filter: 'brightness(1.25) drop-shadow(0 0 20px rgba(255,80,80,0.85))',
    transition: { duration: 0.3 },
  },
  attack: {
    x: -48,
    y: 4,
    scale: 1.06,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
  phase_change: {
    scale: 1.12,
    rotate: [0, -3, 3, 0],
    transition: { duration: 0.6 },
  },
};

const playerVariants = {
  idle: { scale: 1, x: 0 },
  hit: { x: 0 },
  windup: { scale: 1 },
  attack: { scale: 1 },
  phase_change: { scale: 1 },
};

export function AnimatedCombatant({
  role,
  anim,
  isBoss,
  enemySize = 'normal',
  blink,
  entityId,
  entityType,
  imagePath,
  children,
}: AnimatedCombatantProps) {
  const variants = role === 'enemy' ? enemyVariants : playerVariants;
  const idleClass =
    role === 'enemy' ? (isBoss ? 'boss-idle' : 'enemy-idle') : 'player-idle';
  const isHit = anim === 'hit';
  const motionAnim = isHit && role === 'player' ? 'idle' : anim;
  const resolvedEntityType = entityType ?? (isBoss ? 'boss' : 'enemy');

  if (role === 'enemy') {
    return (
      <div className={`animated-combatant enemy enemy-size-${enemySize}`}>
        <motion.div
          className={[
            'combat-portrait-wrap',
            anim === 'idle' ? idleClass : '',
            blink ? 'eye-blink' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          animate={motionAnim}
          variants={variants}
          initial="idle"
        >
          <div className="combat-portrait-glow" aria-hidden />
          <div className="enemy-sprite-placeholder">
            {entityId ? (
              <EntityImage
                entityType={resolvedEntityType}
                entityId={entityId}
                imagePath={imagePath}
                alt=""
                className="enemy-sprite-img"
                fallback={<span className="sprite-icon">{isBoss ? '👁' : '💀'}</span>}
              />
            ) : (
              <span className="sprite-icon">{isBoss ? '👁' : '💀'}</span>
            )}
          </div>
        </motion.div>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={[
        'animated-combatant player',
        anim === 'idle' ? idleClass : '',
        isHit ? 'hit-shake' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      animate={motionAnim}
      variants={variants}
      initial="idle"
    >
      {children}
    </motion.div>
  );
}
