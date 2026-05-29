interface EnemyUILayerProps {
  name: string;
  hp: { current: number; max: number };
  block: number;
  bossPhase?: number;
  isBoss: boolean;
  intent: { description: string; value: number };
  statuses: Array<{ key: string; label: string; className: string }>;
}

/** UI 层 — 意图、血条、状态，不参与立绘动画 */
export function EnemyUILayer({
  name,
  hp,
  block,
  bossPhase,
  isBoss,
  intent,
  statuses,
}: EnemyUILayerProps) {
  return (
    <div className="battle-layer ui-layer enemy-ui-layer">
      <div className="enemy-intent-float">
        <span className="intent-label">意图</span>
        <span className="intent-value">{intent.description}</span>
        <span className="intent-num">{intent.value}</span>
      </div>

      <div className="enemy-hud">
        <h2>{name}</h2>
        <div className="hp-bar">
          <div className="hp-fill enemy-hp" style={{ width: `${(hp.current / hp.max) * 100}%` }} />
          <span className="hp-text">
            {hp.current}/{hp.max}
          </span>
        </div>
        <div className="status-row">
          {block > 0 && <span className="status block">🛡 {block}</span>}
          {isBoss && bossPhase && <span className="status boss-phase">Phase {bossPhase}</span>}
          {statuses.map((s) => (
            <span key={s.key} className={`status ${s.className}`}>
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
