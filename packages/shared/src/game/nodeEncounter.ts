import type {
  CardDefinition,
  CardRarity,
  EventChoice,
  EventEffect,
  NodeEncounterState,
  NodeType,
  RelicDefinition,
  RunState,
} from '../types/game.js';
import { pickFromSeed, shuffleWithSeed } from '../rng/seededRandom.js';
import { addRelicToPlayer } from './relicEngine.js';

export interface GameEventDefinition {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

const CARD_PRICES: Record<CardRarity, number> = {
  starter: 40,
  common: 50,
  uncommon: 75,
  rare: 120,
};

const RELIC_PRICE = 150;

function encounterSeed(run: RunState, suffix: string): string {
  return `${run.seed}:encounter:${run.currentNodeId}:${suffix}`;
}

function generateShopItems(
  run: RunState,
  cards: CardDefinition[],
  relics: RelicDefinition[]
): NodeEncounterState['shop'] {
  const classCards = cards.filter(
    (c) => c.classId === run.player.classId && c.rarity !== 'starter'
  );
  const shuffledCards = shuffleWithSeed(encounterSeed(run, 'shop_cards'), classCards);
  const shopCards = shuffledCards.slice(0, 3).map((c) => ({
    id: c.id,
    type: 'card' as const,
    price: CARD_PRICES[c.rarity] ?? 50,
  }));

  const ownedRelics = new Set(run.player.relics);
  const availableRelics = relics.filter((r) => !ownedRelics.has(r.id));
  const shuffledRelics = shuffleWithSeed(encounterSeed(run, 'shop_relics'), availableRelics);
  const shopRelics = shuffledRelics.slice(0, 2).map((r) => ({
    id: r.id,
    type: 'relic' as const,
    price: RELIC_PRICE,
  }));

  return {
    items: [...shopCards, ...shopRelics],
    purchased: [],
  };
}

function generateTreasure(
  run: RunState,
  relics: RelicDefinition[]
): NodeEncounterState['treasure'] {
  const ownedRelics = new Set(run.player.relics);
  const available = relics.filter((r) => !ownedRelics.has(r.id) && r.rarity !== 'boss');
  const roll = pickFromSeed(encounterSeed(run, 'treasure_roll'), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  if (roll < 5 && available.length > 0) {
    const relic = pickFromSeed(encounterSeed(run, 'treasure_relic'), available);
    return { type: 'relic', relicId: relic.id, claimed: false };
  }

  const gold = 70 + roll * 5;
  return { type: 'gold', gold, claimed: false };
}

function generateEvent(
  run: RunState,
  events: GameEventDefinition[]
): NodeEncounterState['event'] {
  const event = pickFromSeed(encounterSeed(run, 'event'), events);
  return {
    eventId: event.id,
    title: event.title,
    description: event.description,
    choices: event.choices,
    resolved: false,
  };
}

function generateRestUpgradeOptions(run: RunState): string[] {
  const unique = [...new Set(run.player.deck)];
  const shuffled = shuffleWithSeed(encounterSeed(run, 'rest_upgrade'), unique);
  return shuffled.slice(0, 4);
}

export function initEncounter(
  run: RunState,
  nodeType: NodeType,
  contentId: string,
  cards: CardDefinition[],
  relics: RelicDefinition[],
  events: GameEventDefinition[]
): RunState {
  const base: NodeEncounterState = {
    nodeId: run.currentNodeId!,
    nodeType,
    contentId,
  };

  let encounter: NodeEncounterState;

  switch (nodeType) {
    case 'shop':
      encounter = { ...base, shop: generateShopItems(run, cards, relics) };
      break;
    case 'treasure':
      encounter = { ...base, treasure: generateTreasure(run, relics) };
      break;
    case 'random_event':
      encounter = { ...base, event: generateEvent(run, events) };
      break;
    case 'rest':
      encounter = {
        ...base,
        rest: {
          healUsed: false,
          upgradeUsed: false,
          upgradeOptions: generateRestUpgradeOptions(run),
        },
      };
      break;
    default:
      return run;
  }

  return { ...run, encounter, updatedAt: new Date().toISOString() };
}

export function leaveEncounter(run: RunState): RunState {
  return {
    ...run,
    phase: 'map',
    encounter: null,
    updatedAt: new Date().toISOString(),
  };
}

export function buyShopItem(run: RunState, itemKey: string): RunState {
  const shop = run.encounter?.shop;
  if (!shop) throw new Error('Not in shop');

  const item = shop.items.find((i) => `${i.type}:${i.id}` === itemKey || i.id === itemKey);
  if (!item) throw new Error('Item not found');
  if (shop.purchased.includes(itemKey) || shop.purchased.includes(item.id)) {
    throw new Error('Already purchased');
  }
  if (run.player.gold < item.price) throw new Error('Not enough gold');

  let player = { ...run.player, gold: run.player.gold - item.price };

  if (item.type === 'card') {
    player = { ...player, deck: [...player.deck, item.id] };
  } else {
    if (player.relics.includes(item.id)) throw new Error('Already own relic');
    player = addRelicToPlayer(player, item.id);
  }

  return {
    ...run,
    player,
    encounter: {
      ...run.encounter!,
      shop: {
        ...shop,
        purchased: [...shop.purchased, itemKey],
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function restHeal(run: RunState): RunState {
  const rest = run.encounter?.rest;
  if (!rest || rest.healUsed) throw new Error('Heal not available');

  let healAmount = Math.floor(run.player.maxHp * 0.3);
  if (run.player.relics.includes('healer_salve')) {
    healAmount += 5;
  }

  const newHp = Math.min(run.player.maxHp, run.player.currentHp + healAmount);

  return {
    ...run,
    player: { ...run.player, currentHp: newHp },
    encounter: {
      ...run.encounter!,
      rest: { ...rest, healUsed: true },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function restUpgradeCard(run: RunState, cardId: string): RunState {
  const rest = run.encounter?.rest;
  if (!rest || rest.upgradeUsed) throw new Error('Upgrade not available');
  if (!run.player.deck.includes(cardId)) throw new Error('Card not in deck');
  if (run.player.upgradedCards.includes(cardId)) {
    throw new Error('Card already upgraded');
  }

  return {
    ...run,
    player: {
      ...run.player,
      upgradedCards: [...run.player.upgradedCards, cardId],
    },
    encounter: {
      ...run.encounter!,
      rest: { ...rest, upgradeUsed: true },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function restUpgradeMaxHp(run: RunState): RunState {
  const rest = run.encounter?.rest;
  if (!rest || rest.upgradeUsed) throw new Error('Upgrade not available');

  return {
    ...run,
    player: {
      ...run.player,
      maxHp: run.player.maxHp + 8,
      currentHp: run.player.currentHp + 8,
    },
    encounter: {
      ...run.encounter!,
      rest: { ...rest, upgradeUsed: true },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function claimTreasure(run: RunState): RunState {
  const treasure = run.encounter?.treasure;
  if (!treasure || treasure.claimed) throw new Error('Treasure already claimed');

  let player = { ...run.player };

  if (treasure.type === 'gold' && treasure.gold) {
    player = { ...player, gold: player.gold + treasure.gold };
  } else if (treasure.type === 'relic' && treasure.relicId) {
    if (!player.relics.includes(treasure.relicId)) {
      player = addRelicToPlayer(player, treasure.relicId);
    }
  }

  return {
    ...run,
    player,
    phase: 'map',
    encounter: {
      ...run.encounter!,
      treasure: { ...treasure, claimed: true },
    },
    updatedAt: new Date().toISOString(),
  };
}

function pickRandomCardId(run: RunState, cards: CardDefinition[]): string | null {
  const pool = cards.filter((c) => c.classId === run.player.classId && c.rarity !== 'starter');
  if (pool.length === 0) return null;
  return pickFromSeed(encounterSeed(run, 'event_card'), pool).id;
}

function pickRandomRelicId(run: RunState, relics: RelicDefinition[]): string | null {
  const owned = new Set(run.player.relics);
  const pool = relics.filter((r) => !owned.has(r.id) && r.rarity !== 'boss');
  if (pool.length === 0) return null;
  return pickFromSeed(encounterSeed(run, 'event_relic'), pool).id;
}

function applyEventEffect(
  run: RunState,
  effect: EventEffect,
  cards: CardDefinition[],
  relics: RelicDefinition[]
): RunState {
  let player = { ...run.player };

  switch (effect.type) {
    case 'heal':
      player = {
        ...player,
        currentHp: Math.min(player.maxHp, player.currentHp + (effect.value ?? 0)),
      };
      break;
    case 'damage':
      player = {
        ...player,
        currentHp: Math.max(0, player.currentHp - (effect.value ?? 0)),
      };
      break;
    case 'gold':
      player = { ...player, gold: player.gold + (effect.value ?? 0) };
      break;
    case 'loseGold':
      player = { ...player, gold: Math.max(0, player.gold - (effect.value ?? 0)) };
      break;
    case 'maxHpUp':
      player = {
        ...player,
        maxHp: player.maxHp + (effect.value ?? 0),
        currentHp: player.currentHp + (effect.value ?? 0),
      };
      break;
    case 'maxHpDown':
      player = {
        ...player,
        maxHp: Math.max(1, player.maxHp - (effect.value ?? 0)),
        currentHp: Math.min(player.currentHp, player.maxHp),
      };
      break;
    case 'addCard': {
      const cardId = effect.cardId ?? pickRandomCardId(run, cards);
      if (cardId) player = { ...player, deck: [...player.deck, cardId] };
      break;
    }
    case 'addRelic': {
      const relicId = effect.relicId ?? pickRandomRelicId(run, relics);
      if (relicId && !player.relics.includes(relicId)) {
        player = addRelicToPlayer(player, relicId);
      }
      break;
    }
  }

  return { ...run, player };
}

export function resolveEventChoice(
  run: RunState,
  choiceId: string,
  cards: CardDefinition[],
  relics: RelicDefinition[]
): RunState {
  const event = run.encounter?.event;
  if (!event || event.resolved) throw new Error('Event not available');

  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error('Choice not found');

  let updated = run;
  for (const effect of choice.effects) {
    updated = applyEventEffect(updated, effect, cards, relics);
  }

  if (updated.player.currentHp <= 0) {
    return {
      ...updated,
      phase: 'defeat',
      encounter: null,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    ...updated,
    phase: 'event',
    encounter: {
      ...updated.encounter!,
      event: {
        ...event,
        resolved: true,
        outcomeMessage: `${choice.label}：${choice.description}`,
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function countVisitedNodes(run: RunState): number {
  return run.map.nodes.filter((n) => n.visited).length;
}
