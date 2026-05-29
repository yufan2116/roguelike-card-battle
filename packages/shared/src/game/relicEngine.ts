import type { CardDefinition, RelicDefinition, RunPlayerState } from '../types/game.js';

export function applyRelicOnAcquire(
  player: RunPlayerState,
  relicId: string
): RunPlayerState {
  if (relicId === 'cursed_coin') {
    return {
      ...player,
      maxHp: Math.max(1, player.maxHp - 5),
      currentHp: Math.min(player.currentHp, Math.max(1, player.maxHp - 5)),
    };
  }
  return player;
}

export function addRelicToPlayer(
  player: RunPlayerState,
  relicId: string
): RunPlayerState {
  if (player.relics.includes(relicId)) return player;
  const withRelic = {
    ...player,
    relics: [...player.relics, relicId],
  };
  return applyRelicOnAcquire(withRelic, relicId);
}

export function getCardEffects(
  card: CardDefinition,
  upgradedCardIds: string[]
): CardDefinition['effects'] {
  if (upgradedCardIds.includes(card.id) && card.upgradedEffects?.length) {
    return card.upgradedEffects;
  }
  return card.effects;
}

export function isCardUpgraded(
  cardId: string,
  upgradedCardIds: string[]
): boolean {
  return upgradedCardIds.includes(cardId);
}

export function getRelicsByTrigger(
  relics: RelicDefinition[],
  playerRelicIds: string[],
  trigger: string
): RelicDefinition[] {
  const owned = new Set(playerRelicIds);
  return relics.filter((r) => owned.has(r.id) && r.trigger === trigger);
}

export const RELIC_TRIGGERS = {
  COMBAT_START: 'combat_start',
  COMBAT_START_FIRST_TURN: 'combat_start_first_turn',
  FIRST_DEFENSE: 'first_defense_card',
  FIRST_ATTACK: 'first_attack_card',
  ON_BLEED_DEALT: 'on_bleed_dealt',
  LOW_HP_ONCE: 'low_hp_once',
  TURN_START: 'turn_start',
  ON_DAMAGE_TAKEN: 'on_damage_taken',
  COMBAT_VICTORY: 'combat_victory',
  ELITE_VICTORY: 'elite_victory',
  BOSS_VICTORY: 'boss_victory',
  REST_BONUS: 'rest_bonus',
  PASSIVE: 'passive',
} as const;
