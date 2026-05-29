interface CombatResourcePanelProps {
  drawCount: number;
  discardCount: number;
  block: number;
}

export function CombatResourcePanel({ drawCount, discardCount, block }: CombatResourcePanelProps) {
  return (
    <div className="combat-resource-panel">
      <div className="combat-resource-panel__segment">
        <span className="resource-label">抽牌堆</span>
        <span className="resource-value">{drawCount}</span>
      </div>
      <div className="combat-resource-panel__segment combat-resource-panel__segment--block">
        <span className="resource-icon">🛡</span>
        <span className="resource-value">{block}</span>
      </div>
      <div className="combat-resource-panel__segment">
        <span className="resource-label">弃牌堆</span>
        <span className="resource-value">{discardCount}</span>
      </div>
    </div>
  );
}
