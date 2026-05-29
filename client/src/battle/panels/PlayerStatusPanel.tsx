import { EntityImage } from '../../components/EntityImage';
import { AnimatedCombatant } from '../AnimatedCombatant';
import type { CombatantAnimState } from '../BattleEventContext';

interface PlayerStatusPanelProps {
  classId: string;
  playerAnim: CombatantAnimState;
  hp: { current: number; max: number };
  block: number;
  strength: number;
  weak: number;
  vulnerable: number;
  poison: number;
  relicIds: string[];
}

export function PlayerStatusPanel({
  classId,
  playerAnim,
  hp,
  block,
  strength,
  weak,
  vulnerable,
  poison,
  relicIds,
}: PlayerStatusPanelProps) {
  const pct = Math.max(0, Math.min(100, (hp.current / hp.max) * 100));

  return (
    <AnimatedCombatant role="player" anim={playerAnim}>
      <div className="player-status-panel">
        <div className="player-status-panel__avatar">
          <EntityImage
            entityType="class"
            entityId={classId}
            alt="冒险者"
            className="player-status-panel__avatar-img"
            fallback={<span>🧙</span>}
          />
        </div>
        <div className="player-status-panel__body">
          <h3 className="player-status-panel__name">冒险者</h3>
          <div className="player-status-panel__hp hp-bar">
            <div className="hp-fill player-hp" style={{ width: `${pct}%` }} />
            <span className="hp-text">
              {hp.current}/{hp.max}
            </span>
          </div>
          <div className="status-row player-status-panel__stats">
            {block > 0 && <span className="status block">🛡 {block}</span>}
            {strength > 0 && <span className="status str">💪 {strength}</span>}
            {weak > 0 && <span className="status weak">😵 {weak}</span>}
            {vulnerable > 0 && <span className="status vuln">💢 {vulnerable}</span>}
            {poison > 0 && <span className="status poison">☠ {poison}</span>}
          </div>
          {relicIds.length > 0 && (
            <div className="player-status-panel__relics">
              {relicIds.map((id) => (
                <span key={id} className="relic-slot" title={id}>
                  ✦
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </AnimatedCombatant>
  );
}
