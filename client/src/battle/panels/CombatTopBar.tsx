interface CombatTopBarProps {
  turn: number;
  energy: number;
  maxEnergy: number;
}

export function CombatTopBar({ turn, energy, maxEnergy }: CombatTopBarProps) {
  return (
    <header className="combat-top-bar">
      <div className="combat-top-bar__turn">回合 {turn}</div>
      <div className="combat-top-bar__right">
        <div className="combat-top-bar__energy">
          <span className="energy-orb">{energy}</span>
          <span>
            / {maxEnergy} 能量
          </span>
        </div>
        <button type="button" className="combat-top-bar__settings btn btn-ghost" title="设置">
          ⚙
        </button>
      </div>
    </header>
  );
}
