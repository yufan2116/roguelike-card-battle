import type { CardDefinition, ClassDefinition, EnemyDefinition, NodeType } from '../types/game.js';
import {
  canPlayCard,
  endPlayerTurn,
  getEffectiveCost,
  playCard,
  startCombat,
} from '../game/combatEngine.js';
import { createDefaultMetaBonuses, createNewRun } from '../game/runState.js';

export type SimStrategy = 'greedy' | 'defensive' | 'aggressive';
export type SimDeckMode = 'starter' | 'full_pool';

export interface CombatSimOptions {
  strategy?: SimStrategy;
  deckMode?: SimDeckMode;
  runs?: number;
  maxTurns?: number;
  startingRelicId?: string;
  nodeType?: NodeType;
}

export interface CombatSimReport {
  runs: number;
  wins: number;
  losses: number;
  timeouts: number;
  winRate: number;
  avgTurns: number;
  passed: boolean;
  enemyId: string;
  enemyName: string;
  strategy: SimStrategy;
  deckMode: SimDeckMode;
}

const STRATEGY_PRIORITY: Record<SimStrategy, Record<string, number>> = {
  greedy: { attack: 0, skill: 1, defense: 2, status: 3, curse: 4 },
  aggressive: { attack: 0, skill: 2, defense: 4, status: 5, curse: 6 },
  defensive: { defense: 0, skill: 1, attack: 2, status: 3, curse: 4 },
};

function buildSimClass(
  classDef: ClassDefinition,
  cards: CardDefinition[],
  deckMode: SimDeckMode
): ClassDefinition {
  if (deckMode === 'starter') return classDef;

  const poolIds = cards.filter((c) => c.classId === classDef.id).map((c) => c.id);
  const weighted: string[] = [];
  for (const id of poolIds) {
    const card = cards.find((c) => c.id === id)!;
    const copies = card.rarity === 'common' || card.rarity === 'starter' ? 2 : 1;
    for (let i = 0; i < copies; i++) weighted.push(id);
  }

  return {
    ...classDef,
    starterDeck: weighted.length >= 10 ? weighted : classDef.starterDeck,
  };
}

function pickCardIndex(
  hand: string[],
  cards: CardDefinition[],
  combat: Parameters<typeof canPlayCard>[0],
  strategy: SimStrategy
): number {
  const priority = STRATEGY_PRIORITY[strategy];
  const playable = hand
    .map((cardId, index) => ({ cardId, index, card: cards.find((c) => c.id === cardId) }))
    .filter(
      (x): x is { cardId: string; index: number; card: CardDefinition } =>
        !!x.card && canPlayCard(combat, x.card, x.index)
    )
    .sort((a, b) => {
      const pa = priority[a.card.type] ?? 9;
      const pb = priority[b.card.type] ?? 9;
      if (pa !== pb) return pa - pb;
      return getEffectiveCost(combat, b.card, b.index) - getEffectiveCost(combat, a.card, a.index);
    });

  return playable[0]?.index ?? -1;
}

export function simulateSingleFight(
  classDef: ClassDefinition,
  cards: CardDefinition[],
  enemy: EnemyDefinition,
  seed: string,
  options: CombatSimOptions = {}
): { outcome: 'win' | 'loss' | 'timeout'; turns: number } {
  const strategy = options.strategy ?? 'greedy';
  const deckMode = options.deckMode ?? 'starter';
  const maxTurns = options.maxTurns ?? 35;
  const nodeType = options.nodeType ?? (enemy.isBoss ? 'boss' : enemy.isElite ? 'elite_combat' : 'normal_combat');

  const simClass = buildSimClass(classDef, cards, deckMode);
  let run = createNewRun(classDef, createDefaultMetaBonuses(), seed, options.startingRelicId);
  run = { ...run, player: { ...run.player, classId: simClass.id, deck: [...simClass.starterDeck] } };
  run = { ...run, currentNodeId: 'sim_node' };
  run = startCombat(run, enemy, nodeType);

  let turns = 0;
  let steps = 0;

  while (run.combat && steps < 200) {
    if (run.combat.phase === 'victory') return { outcome: 'win', turns };
    if (run.combat.phase === 'defeat') return { outcome: 'loss', turns };

    if (run.combat.phase === 'player_turn') {
      let played = true;
      while (played && run.combat?.phase === 'player_turn') {
        const idx = pickCardIndex(run.combat.player.hand, cards, run.combat, strategy);
        if (idx < 0) {
          played = false;
          break;
        }
        const card = cards.find((c) => c.id === run.combat!.player.hand[idx]);
        if (!card) break;
        run = playCard(run, idx, card, enemy);
      }
      if (run.combat?.phase === 'player_turn') {
        run = endPlayerTurn(run, enemy);
        turns += 1;
        if (turns >= maxTurns) return { outcome: 'timeout', turns };
      }
    }
    steps += 1;
  }

  return { outcome: 'timeout', turns };
}

export function evaluateSimReport(
  report: Omit<CombatSimReport, 'passed'>,
  expectedWinRate: { min: number; max: number }
): boolean {
  const tooEasy = report.winRate >= 0.99 && report.avgTurns < 4;
  return (
    report.winRate >= expectedWinRate.min &&
    report.winRate <= expectedWinRate.max &&
    !tooEasy &&
    report.timeouts <= report.runs * 0.3
  );
}

/** 批量模拟：评估卡组 vs 单个敌人 */
export function runCombatSimulations(
  classDef: ClassDefinition,
  cards: CardDefinition[],
  enemy: EnemyDefinition,
  runs = 12,
  options: Omit<CombatSimOptions, 'runs'> = {}
): CombatSimReport {
  const strategy = options.strategy ?? 'greedy';
  const deckMode = options.deckMode ?? 'starter';
  let wins = 0;
  let losses = 0;
  let timeouts = 0;
  let totalTurns = 0;

  for (let i = 0; i < runs; i++) {
    const seed = `SIM_${classDef.id}_${enemy.id}_${strategy}_${deckMode}_${i}`;
    const result = simulateSingleFight(classDef, cards, enemy, seed, {
      ...options,
      strategy,
      deckMode,
    });
    totalTurns += result.turns;
    if (result.outcome === 'win') wins += 1;
    else if (result.outcome === 'loss') losses += 1;
    else timeouts += 1;
  }

  const winRate = wins / runs;
  const tooEasy = winRate >= 0.99 && totalTurns / runs < 4;
  const passed = winRate >= 0.2 && winRate <= 0.9 && !tooEasy && timeouts <= runs * 0.3;

  return {
    runs,
    wins,
    losses,
    timeouts,
    winRate,
    avgTurns: totalTurns / runs,
    passed,
    enemyId: enemy.id,
    enemyName: enemy.name,
    strategy,
    deckMode,
  };
}
