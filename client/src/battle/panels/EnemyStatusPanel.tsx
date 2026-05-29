interface EnemyStatusPanelProps {
  name: string;
  hp: { current: number; max: number };
  block: number;
  bossPhase?: number;
  isBoss: boolean;
  statuses: Array<{ key: string; label: string; className: string }>;
}

export function EnemyStatusPanel({
  name,
  hp,
  block,
  bossPhase,
  isBoss,
  statuses,
}: EnemyStatusPanelProps) {
  const pct = Math.max(0, Math.min(100, (hp.current / hp.max) * 100));

  return (
    <div className="enemy-status-panel">
      <h2 className="enemy-status-panel__name">{name}</h2>
      <div className="enemy-status-panel__hp hp-bar">
        <div className="hp-fill enemy-hp" style={{ width: `${pct}%` }} />
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
  );
}
