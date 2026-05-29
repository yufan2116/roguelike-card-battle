import { AnimatePresence, motion } from 'framer-motion';
import { useBattleEvents } from './BattleEventContext';
import type { EnemyPortraitSize } from './AnimatedCombatant';
import '../styles/battle-animations.css';

const FLOAT_POSITIONS: Record<EnemyPortraitSize, { enemy: string; player: string }> = {
  normal: { enemy: '28%', player: '72%' },
  elite: { enemy: '26%', player: '72%' },
  boss: { enemy: '24%', player: '72%' },
};

export function BattleAnimationLayer({ enemySize = 'normal' }: { enemySize?: EnemyPortraitSize }) {
  const {
    presentation,
    removeFloatingText,
    removeFlyingCard,
    clearScreenFlash,
    clearBossBanner,
  } = useBattleEvents();

  return (
    <div className="battle-animation-layer" aria-hidden>
      {/* 全屏闪红 — Boss 阶段切换 */}
      <AnimatePresence>
        {presentation.screenFlash !== 'none' && (
          <motion.div
            className={`screen-flash flash-${presentation.screenFlash}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0.25, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            onAnimationComplete={clearScreenFlash}
          />
        )}
      </AnimatePresence>

      {/* Boss 阶段横幅 */}
      <AnimatePresence>
        {presentation.bossPhaseBanner && (
          <motion.div
            className="boss-phase-banner"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1.1, y: 0 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => {
              setTimeout(clearBossBanner, 600);
            }}
          >
            {presentation.bossPhaseBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 飞行卡牌 */}
      <AnimatePresence>
        {presentation.flyingCards.map((card) => (
          <motion.div
            key={card.id}
            className="flying-card"
            initial={{ opacity: 1, x: '20vw', y: '70vh', scale: 1, rotate: -5 }}
            animate={{
              opacity: [1, 1, 0],
              x: '50vw',
              y: '22vh',
              scale: [1, 0.85, 0.3],
              rotate: [-5, 8, 0],
            }}
            transition={{ duration: 0.55, ease: 'easeIn' }}
            onAnimationComplete={() => removeFlyingCard(card.id)}
          >
            {card.cardName}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 飘字 */}
      <AnimatePresence>
        {presentation.floatingTexts.map((ft) => (
          <FloatingText
            key={ft.id}
            item={ft}
            positions={FLOAT_POSITIONS[enemySize]}
            onDone={() => removeFloatingText(ft.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function FloatingText({
  item,
  positions,
  onDone,
}: {
  item: {
    id: string;
    targetId: 'player' | 'enemy_0';
    text: string;
    variant: 'damage' | 'block' | 'heal' | 'status';
  };
  positions: { enemy: string; player: string };
  onDone: () => void;
}) {
  const isEnemy = item.targetId === 'enemy_0';
  const top = isEnemy ? positions.enemy : positions.player;

  return (
    <motion.div
      className={`floating-text float-${item.variant}`}
      style={{ left: '50%', top }}
      initial={{ opacity: 0, y: 10, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: [10, -20, -50, -80], scale: [0.6, 1.2, 1, 0.8] }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      {item.text}
    </motion.div>
  );
}
