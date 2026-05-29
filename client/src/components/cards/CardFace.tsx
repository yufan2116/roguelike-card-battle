import { useState } from 'react';
import type { CardDefinition } from '@rcb/shared';
import { EntityImage } from '../EntityImage';

const TYPE_COLORS: Record<string, string> = {
  attack: '#c45c3e',
  defense: '#5a7a9e',
  skill: '#7a5a9e',
  status: '#6a6a6a',
  curse: '#4a2040',
};

const TYPE_LABELS: Record<string, string> = {
  attack: '攻击',
  defense: '防御',
  skill: '技能',
  status: '状态',
  curse: '诅咒',
};

export interface CardFaceProps {
  card: CardDefinition;
  cost?: number;
  variant?: 'hand' | 'reward' | 'preview';
  playable?: boolean;
  disabled?: boolean;
  upgraded?: boolean;
  onClick?: () => void;
  className?: string;
}

function shortEffect(text: string, maxLen = 56): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen)}…`;
}

export function CardFace({
  card,
  cost,
  variant = 'hand',
  playable = false,
  disabled = false,
  upgraded = false,
  onClick,
  className = '',
}: CardFaceProps) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = TYPE_COLORS[card.type] ?? '#2a3040';
  const displayCost = cost ?? card.cost;
  const isHand = variant === 'hand';

  const rootClass = [
    'card-face',
    `card-face--${variant}`,
    `type-${card.type}`,
    playable ? 'playable' : '',
    disabled ? 'disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <>
      <div className="card-face__art">
        <EntityImage
          entityType="card"
          entityId={card.id}
          imagePath={card.imagePath}
          alt={card.name}
          className="card-face__img"
        />
      </div>
      <div className="card-face__body">
        <span className="card-face__cost" style={{ borderColor }}>
          {displayCost}
        </span>
        <h4 className="card-face__name">
          {card.name}
          {upgraded && ' +'}
        </h4>
        <p className="card-face__effect">{shortEffect(card.description)}</p>
        <span className="card-face__type" style={{ color: borderColor }}>
          {TYPE_LABELS[card.type] ?? card.type}
          {card.rarity && card.rarity !== 'common' ? ` · ${card.rarity}` : ''}
        </span>
      </div>
    </>
  );

  if (isHand && onClick) {
    return (
      <>
        <button
          type="button"
          className={rootClass}
          style={{ borderColor }}
          disabled={disabled}
          onClick={onClick}
          onContextMenu={(e) => {
            e.preventDefault();
            setExpanded(true);
          }}
          title={card.description}
        >
          {inner}
        </button>
        {expanded && (
          <CardDetailModal card={card} cost={displayCost} upgraded={upgraded} onClose={() => setExpanded(false)} />
        )}
      </>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={rootClass} style={{ borderColor }} disabled={disabled} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return (
    <div className={rootClass} style={{ borderColor }} title={card.description}>
      {inner}
    </div>
  );
}

function CardDetailModal({
  card,
  cost,
  upgraded,
  onClose,
}: {
  card: CardDefinition;
  cost: number;
  upgraded: boolean;
  onClose: () => void;
}) {
  return (
    <div className="card-detail-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="card-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn btn-ghost card-detail-close" onClick={onClose}>
          ✕
        </button>
        <CardFace card={card} cost={cost} variant="preview" upgraded={upgraded} />
        <p className="card-detail-full">{card.description}</p>
      </div>
    </div>
  );
}
