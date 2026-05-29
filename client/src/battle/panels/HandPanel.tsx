import type { CardDefinition } from '@rcb/shared';
import type { CombatState } from '@rcb/shared';
import { canPlayCard, getEffectiveCost } from '@rcb/shared';
import { CardFace } from '../../components/cards/CardFace';

interface HandPanelProps {
  combat: CombatState;
  cards: Map<string, CardDefinition>;
  isPlayerTurn: boolean;
  loading: boolean;
  onPlayCard: (handIndex: number) => void;
}

export function HandPanel({ combat, cards, isPlayerTurn, loading, onPlayCard }: HandPanelProps) {
  return (
    <div className="hand-panel">
      <div className="hand-panel__cards">
        {combat.player.hand.map((cardId, index) => {
          const card = cards.get(cardId);
          if (!card) return null;
          const playable = isPlayerTurn && canPlayCard(combat, card, index);
          const cost = getEffectiveCost(combat, card, index);
          return (
            <CardFace
              key={`${cardId}-${index}`}
              card={card}
              cost={cost}
              variant="hand"
              playable={playable}
              disabled={!playable || loading}
              upgraded={combat.player.upgradedCards?.includes(cardId)}
              onClick={() => onPlayCard(index)}
            />
          );
        })}
      </div>
    </div>
  );
}
