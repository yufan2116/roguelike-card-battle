interface EnemyIntentPanelProps {
  description: string;
  value: number;
}

export function EnemyIntentPanel({ description, value }: EnemyIntentPanelProps) {
  return (
    <aside className="enemy-intent-panel">
      <span className="enemy-intent-panel__label">意图</span>
      <span className="enemy-intent-panel__desc">{description}</span>
      <span className="enemy-intent-panel__value">{value}</span>
    </aside>
  );
}
