import type { CombatState } from '../types/game.js';

export type BattleEntityId = 'player' | 'enemy_0';

export type BattleEvent =
  | DamageEvent
  | BlockEvent
  | HealEvent
  | CardPlayEvent
  | CardFlyEvent
  | EnemyAttackEvent
  | BossPhaseChangeEvent
  | DrawEvent
  | StatusEvent
  | VictoryEvent
  | TurnStartEvent
  | ShakeEvent;

export interface DamageEvent {
  type: 'damage';
  sourceId: string;
  targetId: BattleEntityId;
  amount: number;
  blocked?: number;
}

export interface BlockEvent {
  type: 'block';
  sourceId: string;
  targetId: BattleEntityId;
  amount: number;
}

export interface HealEvent {
  type: 'heal';
  sourceId: string;
  targetId: BattleEntityId;
  amount: number;
}

export interface CardPlayEvent {
  type: 'card_play';
  sourceId: 'player';
  cardName: string;
  cardType?: string;
  handIndex?: number;
}

export interface CardFlyEvent {
  type: 'card_fly';
  sourceId: 'player';
  targetId: 'enemy_0';
  cardName: string;
  handIndex?: number;
}

export interface EnemyAttackEvent {
  type: 'enemy_attack';
  sourceId: 'enemy_0';
  targetId: 'player';
  actionName: string;
  windup?: boolean;
}

export interface BossPhaseChangeEvent {
  type: 'boss_phase_change';
  sourceId: 'enemy_0';
  bossName: string;
  phase: number;
}

export interface DrawEvent {
  type: 'draw';
  sourceId: 'player';
  amount: number;
}

export interface StatusEvent {
  type: 'status';
  targetId: BattleEntityId;
  status: 'bleed' | 'poison' | 'weak' | 'vulnerable';
  amount: number;
}

export interface VictoryEvent {
  type: 'victory';
}

export interface TurnStartEvent {
  type: 'turn_start';
  turn: number;
}

export interface ShakeEvent {
  type: 'shake';
  targetId: BattleEntityId;
}

let eventCounter = 0;

export function createEventId(): string {
  eventCounter += 1;
  return `evt_${Date.now()}_${eventCounter}`;
}

/** 从战斗状态差异 + 新增日志提取表现层事件（不修改战斗引擎） */
export function extractBattleEvents(
  prev: CombatState | null,
  next: CombatState,
  prevLogLength = 0
): BattleEvent[] {
  const events: BattleEvent[] = [];
  const newLogs = next.log.slice(prevLogLength);

  for (const entry of newLogs) {
    events.push(...parseLogMessage(entry.message, entry.actor));
  }

  if (prev) {
    events.push(...diffCombatState(prev, next));
  }

  return dedupeEvents(events);
}

function parseLogMessage(message: string, _actor: string): BattleEvent[] {
  const events: BattleEvent[] = [];

  const turnMatch = message.match(/^Turn (\d+):$/);
  if (turnMatch) {
    events.push({ type: 'turn_start', turn: parseInt(turnMatch[1], 10) });
  }

  const cardPlayMatch = message.match(/^Player played (.+?)(?:,|$)/);
  if (cardPlayMatch) {
    const cardName = cardPlayMatch[1].trim();
    events.push({
      type: 'card_play',
      sourceId: 'player',
      cardName,
    });
    // card_fly 由 UI 层 optimistic 触发，避免重复

    const dealtMatches = message.matchAll(/dealt (\d+) damage(?: \((\d+) blocked\))?/g);
    for (const m of dealtMatches) {
      events.push({
        type: 'damage',
        sourceId: 'player',
        targetId: 'enemy_0',
        amount: parseInt(m[1], 10),
        blocked: m[2] ? parseInt(m[2], 10) : undefined,
      });
      events.push({ type: 'shake', targetId: 'enemy_0' });
    }

    const blockGain = message.match(/gained (\d+) Block/);
    if (blockGain) {
      events.push({
        type: 'block',
        sourceId: 'player',
        targetId: 'player',
        amount: parseInt(blockGain[1], 10),
      });
    }

    const healGain = message.match(/healed (\d+) HP/);
    if (healGain) {
      events.push({
        type: 'heal',
        sourceId: 'player',
        targetId: 'player',
        amount: parseInt(healGain[1], 10),
      });
    }

    const drawMatch = message.match(/drew (\d+) cards?/);
    if (drawMatch) {
      events.push({
        type: 'draw',
        sourceId: 'player',
        amount: parseInt(drawMatch[1], 10),
      });
    }
  }

  const enemyAttackMatch = message.match(/^Enemy used (.+)$/);
  if (enemyAttackMatch) {
    events.push({
      type: 'enemy_attack',
      sourceId: 'enemy_0',
      targetId: 'player',
      actionName: enemyAttackMatch[1],
      windup: true,
    });
  }

  const enemyDamageMatch = message.match(/^Enemy dealt (\d+) damage/);
  if (enemyDamageMatch) {
    events.push({
      type: 'damage',
      sourceId: 'enemy_0',
      targetId: 'player',
      amount: parseInt(enemyDamageMatch[1], 10),
    });
    events.push({ type: 'shake', targetId: 'player' });
  }

  const playerBlockedMatch = message.match(/^Player blocked (\d+) damage/);
  if (playerBlockedMatch) {
    events.push({
      type: 'block',
      sourceId: 'player',
      targetId: 'player',
      amount: parseInt(playerBlockedMatch[1], 10),
    });
  }

  const bleedEnemy = message.match(/^Enemy took (\d+) Bleed damage/);
  if (bleedEnemy) {
    events.push({
      type: 'damage',
      sourceId: 'system',
      targetId: 'enemy_0',
      amount: parseInt(bleedEnemy[1], 10),
    });
    events.push({ type: 'status', targetId: 'enemy_0', status: 'bleed', amount: 1 });
    events.push({ type: 'shake', targetId: 'enemy_0' });
  }

  const poisonPlayer = message.match(/^Player took (\d+) Poison damage/);
  if (poisonPlayer) {
    events.push({
      type: 'damage',
      sourceId: 'system',
      targetId: 'player',
      amount: parseInt(poisonPlayer[1], 10),
    });
    events.push({ type: 'status', targetId: 'player', status: 'poison', amount: 1 });
    events.push({ type: 'shake', targetId: 'player' });
  }

  const bleedPlayer = message.match(/^Player took (\d+) Bleed damage/);
  if (bleedPlayer) {
    events.push({
      type: 'damage',
      sourceId: 'system',
      targetId: 'player',
      amount: parseInt(bleedPlayer[1], 10),
    });
    events.push({ type: 'shake', targetId: 'player' });
  }

  const phaseMatch = message.match(/^(.+?) enters Phase (\d+)!$/);
  if (phaseMatch) {
    events.push({
      type: 'boss_phase_change',
      sourceId: 'enemy_0',
      bossName: phaseMatch[1],
      phase: parseInt(phaseMatch[2], 10),
    });
  }

  const drawCards = message.match(/^Player drew (\d+) cards?/);
  if (drawCards && !message.includes('Player played')) {
    events.push({
      type: 'draw',
      sourceId: 'player',
      amount: parseInt(drawCards[1], 10),
    });
  }

  if (message.includes('Victory!')) {
    events.push({ type: 'victory' });
  }

  return events;
}

function diffCombatState(prev: CombatState, next: CombatState): BattleEvent[] {
  const events: BattleEvent[] = [];
  const prevEnemy = prev.enemies[0];
  const nextEnemy = next.enemies[0];
  if (!prevEnemy || !nextEnemy) return events;

  const enemyHpLoss = prevEnemy.currentHp - nextEnemy.currentHp;
  const playerHpLoss = prev.player.currentHp - next.player.currentHp;

  // 仅当日志未覆盖时用 diff 补充（避免重复）
  if (enemyHpLoss > 0) {
    const hasDamageEvent = next.log.length > prev.log.length;
    if (!hasDamageEvent) {
      events.push({
        type: 'damage',
        sourceId: 'unknown',
        targetId: 'enemy_0',
        amount: enemyHpLoss,
      });
    }
  }

  if (playerHpLoss > 0 && prev.player.currentHp > next.player.currentHp) {
    // diff backup only
  }

  if (
    prevEnemy.bossPhase !== nextEnemy.bossPhase &&
    nextEnemy.bossPhase &&
    nextEnemy.isBoss
  ) {
    const alreadyHas = prev.log.length !== next.log.length;
    if (!alreadyHas) {
      events.push({
        type: 'boss_phase_change',
        sourceId: 'enemy_0',
        bossName: nextEnemy.name,
        phase: nextEnemy.bossPhase,
      });
    }
  }

  return events;
}

function dedupeEvents(events: BattleEvent[]): BattleEvent[] {
  const seen = new Set<string>();
  const result: BattleEvent[] = [];
  for (const e of events) {
    const key = JSON.stringify(e);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(e);
  }
  return result;
}

/** 合并连续同类事件中的伤害数字（可选优化） */
export function attachEventIds(events: BattleEvent[]): Array<BattleEvent & { id: string }> {
  return events.map((e) => ({ ...e, id: createEventId() }));
}

export type BattleEventWithId = BattleEvent & { id: string };
