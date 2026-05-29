interface TurnActionPanelProps {
  disabled: boolean;
  loading: boolean;
  onEndTurn: () => void;
}

export function TurnActionPanel({ disabled, loading, onEndTurn }: TurnActionPanelProps) {
  return (
    <div className="turn-action-panel">
      <button
        type="button"
        className="turn-action-panel__btn"
        onClick={onEndTurn}
        disabled={disabled || loading}
      >
        <span className="turn-action-panel__label">结束回合</span>
        <span className="turn-action-panel__arrows" aria-hidden>
          ››
        </span>
      </button>
    </div>
  );
}
