import type {
  CardDefinition,
  CombatEnemyState,
  CombatLogEntry,
  CombatRelicFlags,
  CombatState,
  EnemyAction,
  EnemyDefinition,
  NodeType,
  RunPlayerState,
  RunState,
} from '../types/game.js';
import { createSeededRng, shuffleWithSeed } from '../rng/seededRandom.js';
import { pickEnemyId } from './enemyPicker.js';
import { generateRewardCardIds } from './cardRewards.js';
import { getCardEffects } from './relicEngine.js';

const HAND_SIZE = 5;

function log(
  combat: CombatState,
  actor: CombatLogEntry['actor'],
  message: string
): CombatLogEntry[] {
  return [
    ...combat.log,
    { turn: combat.turn, actor, message, timestamp: Date.now() },
  ];
}

function clonePlayer(p: RunPlayerState): RunPlayerState {
  return {
    ...p,
    deck: [...p.deck],
    hand: [...p.hand],
    discard: [...p.discard],
    drawPile: [...p.drawPile],
    exhaustPile: [...p.exhaustPile],
    relics: [...p.relics],
    upgradedCards: [...p.upgradedCards],
  };
}

function calcBlock(base: number, dexterity: number): number {
  return Math.max(0, base + dexterity);
}

function applyDamageToPlayer(
  player: RunPlayerState,
  damage: number
): { player: RunPlayerState; blocked: number; taken: number } {
  const blocked = Math.min(player.block, damage);
  const taken = damage - blocked;
  return {
    player: {
      ...player,
      block: player.block - blocked,
      currentHp: Math.max(0, player.currentHp - taken),
    },
    blocked,
    taken,
  };
}

function applyDamageToEnemy(
  enemy: CombatEnemyState,
  damage: number
): { enemy: CombatEnemyState; blocked: number; taken: number } {
  const blocked = Math.min(enemy.block, damage);
  const taken = damage - blocked;
  return {
    enemy: {
      ...enemy,
      block: enemy.block - blocked,
      currentHp: Math.max(0, enemy.currentHp - taken),
    },
    blocked,
    taken,
  };
}

function drawCards(
  player: RunPlayerState,
  count: number,
  seed: string,
  turn: number
): { player: RunPlayerState; drawn: number } {
  let p = clonePlayer(player);
  let drawn = 0;

  for (let i = 0; i < count; i++) {
    if (p.drawPile.length === 0) {
      if (p.discard.length === 0) break;
      p.drawPile = shuffleWithSeed(`${seed}:reshuffle:${turn}:${i}`, p.discard);
      p.discard = [];
    }
    const card = p.drawPile.pop();
    if (card) {
      p.hand.push(card);
      drawn++;
    }
  }
  return { player: p, drawn };
}

function createEnemyState(def: EnemyDefinition): CombatEnemyState {
  const isBoss = !!(def.isBoss && def.phases?.length);
  const actions = getEnemyActionList(def, isBoss ? 1 : undefined);
  const action = actions[0];
  return {
    definitionId: def.id,
    name: def.name,
    currentHp: def.maxHp,
    maxHp: def.maxHp,
    block: 0,
    strength: 0,
    dexterity: 0,
    weak: 0,
    vulnerable: 0,
    bleed: 0,
    poison: 0,
    actionIndex: 0,
    intent: action.intent,
    isBoss,
    bossPhase: isBoss ? 1 : undefined,
  };
}

function getEnemyActionList(
  def: EnemyDefinition,
  bossPhase?: number
): EnemyAction[] {
  if (def.isBoss && def.phases?.length) {
    const phase = def.phases.find((p) => p.phase === (bossPhase ?? 1)) ?? def.phases[0];
    return phase.actions;
  }
  return def.actions;
}

function getEnemyIntentFromState(
  def: EnemyDefinition,
  enemy: CombatEnemyState
): EnemyAction {
  const actions = getEnemyActionList(def, enemy.bossPhase);
  return actions[enemy.actionIndex % actions.length];
}

function checkBossPhaseTransition(
  combat: CombatState,
  enemyDef: EnemyDefinition,
  enemy: CombatEnemyState,
  currentLog: CombatLogEntry[]
): { enemy: CombatEnemyState; log: CombatLogEntry[] } {
  if (!enemy.isBoss || !enemyDef.phases?.length) {
    return { enemy, log: currentLog };
  }

  const hpRatio = enemy.currentHp / enemy.maxHp;
  const currentPhase = enemy.bossPhase ?? 1;
  const nextPhase = enemyDef.phases.find(
    (p) => p.phase > currentPhase && hpRatio <= p.hpThreshold
  );

  if (!nextPhase) return { enemy, log: currentLog };

  let updated: CombatEnemyState = {
    ...enemy,
    bossPhase: nextPhase.phase,
    actionIndex: 0,
  };
  let newLog = log(
    { ...combat, log: currentLog },
    'system',
    `${enemy.name} enters Phase ${nextPhase.phase}!`
  );

  for (const effect of nextPhase.onEnterEffects ?? []) {
    if (effect.mechanism === 'gainStrength') {
      updated.strength += effect.value;
      newLog = log(
        { ...combat, log: newLog },
        'enemy',
        `Boss gained ${effect.value} Strength`
      );
    }
  }

  const firstAction = nextPhase.actions[0];
  updated.intent = firstAction.intent;
  newLog = log(
    { ...combat, log: newLog },
    'enemy',
    `Enemy intends: ${firstAction.intent.description} (${firstAction.intent.value})`
  );

  return { enemy: updated, log: newLog };
}

function defaultRelicFlags(): CombatRelicFlags {
  return {
    firstDefenseUsed: false,
    firstAttackUsed: false,
    firstSkillUsed: false,
    lowHpTriggered: false,
    extraFirstDraw: false,
  };
}

function applyCombatStartRelics(
  combat: CombatState,
  seed: string
): CombatState {
  let player = clonePlayer(combat.player);
  let newLog = combat.log;
  const relicFlags = defaultRelicFlags();

  if (player.relics.includes('iron_charm')) {
    player.block += 4;
    newLog = log({ ...combat, log: newLog }, 'system', 'Iron Charm: gained 4 Block');
  }

  if (player.relics.includes('demon_dice') && player.hand.length > 0) {
    const rng = createSeededRng(`${seed}:demon_dice`);
    relicFlags.demonDiceHandIndex = Math.floor(rng() * player.hand.length);
    newLog = log(
      { ...combat, log: newLog },
      'system',
      `Demon Dice: hand card #${relicFlags.demonDiceHandIndex + 1} costs 0`
    );
  }

  if (player.relics.includes('broken_pocketwatch')) {
    relicFlags.extraFirstDraw = true;
  }

  return { ...combat, player, log: newLog, relicFlags };
}

function checkLowHpRelic(
  combat: CombatState,
  player: RunPlayerState
): { player: RunPlayerState; log: CombatLogEntry[]; flags: CombatRelicFlags } {
  let newLog = combat.log;
  const flags = { ...(combat.relicFlags ?? defaultRelicFlags()) };

  if (
    player.relics.includes('ash_pendant') &&
    !flags.lowHpTriggered &&
    player.currentHp / player.maxHp < 0.5
  ) {
    flags.lowHpTriggered = true;
    player = { ...player, energy: player.energy + 2 };
    newLog = log({ ...combat, log: newLog }, 'system', 'Ash Pendant: gained 2 Energy');
  }

  return { player, log: newLog, flags };
}

export function startCombat(
  run: RunState,
  enemyDef: EnemyDefinition,
  nodeType: NodeType
): RunState {
  const player = clonePlayer(run.player);
  // 将卡组洗入抽牌堆
  player.drawPile = shuffleWithSeed(
    `${run.seed}:combat:${run.currentNodeId}`,
    player.deck
  );
  player.deck = [];
  player.hand = [];
  player.discard = [];
  player.exhaustPile = [];
  player.block = 0;
  player.energy = player.maxEnergy;
  player.weak = 0;
  player.vulnerable = 0;
  player.bleed = 0;
  player.poison = 0;

  let combat: CombatState = {
    turn: 1,
    phase: 'player_turn',
    enemies: [createEnemyState(enemyDef)],
    player,
    log: [],
    nextAttackBonus: 0,
    costReduction: 0,
    nodeType,
    enemyDefinitionId: enemyDef.id,
    relicFlags: defaultRelicFlags(),
  };

  const { player: afterDraw, drawn } = drawCards(
    combat.player,
    HAND_SIZE,
    run.seed,
    1
  );
  combat = { ...combat, player: afterDraw };
  combat = applyCombatStartRelics(combat, run.seed);

  let totalDrawn = drawn;
  if (combat.relicFlags?.extraFirstDraw) {
    const extra = drawCards(combat.player, 1, run.seed, 1);
    combat = { ...combat, player: extra.player };
    totalDrawn += extra.drawn;
    combat = {
      ...combat,
      log: log(combat, 'system', 'Broken Pocketwatch: drew 1 extra card'),
    };
  }

  const firstActions = getEnemyActionList(enemyDef, combat.enemies[0].bossPhase);
  combat = {
    ...combat,
    log: log(combat, 'system', `Turn 1:`),
  };
  combat = {
    ...combat,
    log: log(combat, 'player', `Player drew ${totalDrawn} cards`),
  };
  combat = {
    ...combat,
    log: log(
      combat,
      'enemy',
      `Enemy ${enemyDef.name} intends: ${firstActions[0].intent.description} (${firstActions[0].intent.value})`
    ),
  };

  return {
    ...run,
    combat,
    combatLog: [...run.combatLog, ...combat.log],
  };
}

export function initCombatForNode(
  run: RunState,
  enemies: EnemyDefinition[]
): RunState {
  if (!run.currentNodeId) return run;
  const node = run.map.nodes.find((n) => n.id === run.currentNodeId);
  if (!node) return run;

  const isCombat =
    node.type === 'normal_combat' ||
    node.type === 'elite_combat' ||
    node.type === 'boss';
  if (!isCombat) return run;

  const enemyId = pickEnemyId(run.seed, node.contentId ?? node.id, node.type);
  const enemyDef = enemies.find((e) => e.id === enemyId);
  if (!enemyDef) return run;

  return startCombat(run, enemyDef, node.type);
}

export function playCard(
  run: RunState,
  handIndex: number,
  cardDef: CardDefinition,
  enemyDef?: EnemyDefinition
): RunState {
  const combat = run.combat;
  if (!combat || combat.phase !== 'player_turn') return run;

  const cardId = combat.player.hand[handIndex];
  if (!cardId || cardId !== cardDef.id) return run;

  let effectiveCost = Math.max(0, cardDef.cost - combat.costReduction);
  if (combat.relicFlags?.demonDiceHandIndex === handIndex) {
    effectiveCost = 0;
  }
  if (combat.player.energy < effectiveCost) return run;

  let player = clonePlayer(combat.player);
  let enemies = combat.enemies.map((e) => ({ ...e }));
  let nextAttackBonus = combat.nextAttackBonus;
  let costReduction = combat.costReduction;
  let relicFlags = { ...(combat.relicFlags ?? defaultRelicFlags()) };
  let newLog = combat.log;

  player.energy -= effectiveCost;
  player.hand.splice(handIndex, 1);

  const messages: string[] = [];
  const activeEffects = getCardEffects(cardDef, player.upgradedCards ?? []);

  for (const effect of activeEffects) {
    const target = effect.target ?? (cardDef.type === 'defense' ? 'self' : 'enemy');

    if (effect.mechanism === 'draw') {
      const result = drawCards(player, effect.value, run.seed, combat.turn);
      player = result.player;
      messages.push(`drew ${result.drawn} cards`);
      continue;
    }

    if (effect.mechanism === 'increaseNextAttackDamage') {
      nextAttackBonus += effect.value;
      messages.push(`next attack +${effect.value}`);
      continue;
    }

    if (effect.mechanism === 'reduceCardCostThisCombat') {
      costReduction += effect.value;
      messages.push(`cost -${effect.value} this combat`);
      continue;
    }

    if (effect.mechanism === 'gainEnergy') {
      player.energy += effect.value;
      messages.push(`gained ${effect.value} Energy`);
      if (
        cardDef.type === 'skill' &&
        !relicFlags.firstSkillUsed &&
        player.relics.includes('arcane_battery')
      ) {
        player.energy += 1;
        relicFlags.firstSkillUsed = true;
        messages.push('Arcane Battery +1 Energy');
      }
      continue;
    }

    if (target === 'self') {
      if (effect.mechanism === 'loseHp') {
        player.currentHp = Math.max(0, player.currentHp - effect.value);
        messages.push(`lost ${effect.value} HP`);
      } else if (effect.mechanism === 'block') {
        let blockGain = calcBlock(effect.value, player.dexterity);
        if (
          cardDef.type === 'defense' &&
          !relicFlags.firstDefenseUsed &&
          player.relics.includes('old_knight_badge')
        ) {
          blockGain += 2;
          relicFlags.firstDefenseUsed = true;
          messages.push('Old Knight Badge +2 Block');
        }
        player.block += blockGain;
        messages.push(`gained ${blockGain} Block`);
      } else if (effect.mechanism === 'heal') {
        player.currentHp = Math.min(player.maxHp, player.currentHp + effect.value);
        messages.push(`healed ${effect.value} HP`);
      } else if (effect.mechanism === 'gainStrength') {
        player.strength += effect.value;
        messages.push(`gained ${effect.value} Strength`);
      } else if (effect.mechanism === 'gainDexterity') {
        player.dexterity += effect.value;
        messages.push(`gained ${effect.value} Dexterity`);
      }
      continue;
    }

    // Target enemy (player attacks enemy)
    if (effect.mechanism === 'damage') {
      let base = effect.value + player.strength;
      if (cardDef.type === 'attack') {
        base += nextAttackBonus;
        if (
          !relicFlags.firstAttackUsed &&
          player.relics.includes('hunters_token')
        ) {
          base += 3;
          relicFlags.firstAttackUsed = true;
          messages.push('Hunter Token +3 damage');
        }
      }
      if (player.weak > 0) base = Math.floor(base * 0.75);
      let dmg = base;
      if (enemies[0].vulnerable > 0) dmg = Math.ceil(dmg * 1.5);

      const result = applyDamageToEnemy(enemies[0], dmg);
      enemies[0] = result.enemy;
      messages.push(`dealt ${result.taken} damage${result.blocked ? ` (${result.blocked} blocked)` : ''}`);
      if (cardDef.type === 'attack' && nextAttackBonus > 0) {
        nextAttackBonus = 0;
      }
    } else if (effect.mechanism === 'applyBleed') {
      enemies[0].bleed += effect.value;
      messages.push(`applied ${effect.value} Bleed`);
      if (player.relics.includes('blood_ring')) {
        player.currentHp = Math.min(player.maxHp, player.currentHp + 1);
        messages.push('Blood Ring healed 1 HP');
      }
    } else if (effect.mechanism === 'applyWeak') {
      enemies[0].weak += effect.value;
      messages.push(`applied ${effect.value} Weak`);
    } else if (effect.mechanism === 'applyVulnerable') {
      enemies[0].vulnerable += effect.value;
      messages.push(`applied ${effect.value} Vulnerable`);
    } else if (effect.mechanism === 'applyPoison') {
      enemies[0].poison += effect.value;
      messages.push(`applied ${effect.value} Poison`);
    }
  }

  if (enemyDef && enemies[0].isBoss) {
    const phaseResult = checkBossPhaseTransition(
      { ...combat, log: newLog },
      enemyDef,
      enemies[0],
      newLog
    );
    enemies[0] = phaseResult.enemy;
    newLog = phaseResult.log;
  }

  const shouldExhaust = activeEffects.some((e) => e.mechanism === 'exhaust');
  const shouldRetain = activeEffects.some((e) => e.mechanism === 'retain');

  if (shouldExhaust) {
    player.exhaustPile.push(cardId);
  } else if (!shouldRetain) {
    player.discard.push(cardId);
  } else {
    player.hand.push(cardId);
  }

  const logMsg = `Player played ${cardDef.name}${messages.length ? ', ' + messages.join(', ') : ''}`;
  newLog = log({ ...combat, log: newLog }, 'player', logMsg);

  let phase: CombatState['phase'] = combat.phase;
  if (enemies[0].currentHp <= 0) {
    phase = 'victory';
    newLog = log({ ...combat, log: newLog }, 'system', 'Victory! Enemy defeated.');
  }

  const updatedCombat: CombatState = {
    ...combat,
    player,
    enemies,
    log: newLog,
    nextAttackBonus,
    costReduction,
    relicFlags,
    phase,
  };

  if (phase === 'victory') {
    return finalizeVictory({ ...run, combat: updatedCombat });
  }

  return { ...run, combat: updatedCombat, combatLog: [...run.combatLog, ...newLog.slice(combat.log.length)] };
}

function resolveBleedOnEnemy(
  enemy: CombatEnemyState
): { enemy: CombatEnemyState; damage: number } {
  if (enemy.bleed <= 0) return { enemy, damage: 0 };
  const damage = enemy.bleed;
  const updated = {
    ...enemy,
    bleed: enemy.bleed - 1,
    currentHp: Math.max(0, enemy.currentHp - damage),
  };
  return { enemy: updated, damage };
}

function resolvePoisonOnPlayer(
  player: RunPlayerState
): { player: RunPlayerState; damage: number } {
  if (player.poison <= 0) return { player, damage: 0 };
  const damage = player.poison;
  return {
    player: {
      ...player,
      poison: player.poison - 1,
      currentHp: Math.max(0, player.currentHp - damage),
    },
    damage,
  };
}

export function endPlayerTurn(
  run: RunState,
  enemyDef: EnemyDefinition
): RunState {
  let combat = run.combat;
  if (!combat || combat.phase !== 'player_turn') return run;

  let newLog = combat.log;
  newLog = log({ ...combat, log: newLog }, 'system', 'End of turn effects resolved');

  // 敌人流血
  let enemies = [...combat.enemies];
  const bleedResult = resolveBleedOnEnemy(enemies[0]);
  if (bleedResult.damage > 0) {
    enemies[0] = bleedResult.enemy;
    newLog = log(
      { ...combat, log: newLog },
      'system',
      `Enemy took ${bleedResult.damage} Bleed damage`
    );
  }

  if (enemies[0].currentHp <= 0) {
    const victoryCombat: CombatState = {
      ...combat,
      enemies,
      log: log({ ...combat, log: newLog }, 'system', 'Victory! Enemy defeated.'),
      phase: 'victory',
    };
    return finalizeVictory({ ...run, combat: victoryCombat });
  }

  // 玩家中毒
  let player = clonePlayer(combat.player);
  const poisonResult = resolvePoisonOnPlayer(player);
  if (poisonResult.damage > 0) {
    player = poisonResult.player;
    newLog = log(
      { ...combat, log: newLog },
      'system',
      `Player took ${poisonResult.damage} Poison damage`
    );
  }

  if (player.currentHp <= 0) {
    return finalizeDefeat({ ...run, combat: { ...combat, player, enemies, log: newLog, phase: 'defeat' } });
  }

  // 弃牌（保留 retain）
  const retained: string[] = [];
  const toDiscard: string[] = [];
  for (const cardId of player.hand) {
    toDiscard.push(cardId);
  }
  player.discard.push(...toDiscard);
  player.hand = retained;

  // 敌人行动
  const action = getEnemyIntentFromState(enemyDef, enemies[0]);
  newLog = log(
    { ...combat, log: newLog },
    'enemy',
    `Enemy used ${action.intent.description}`
  );

  for (const effect of action.effects) {
    const target = effect.target ?? 'enemy';

    if (target === 'enemy' || target === 'self') {
      // 敌人视角：enemy = 玩家
      if (effect.mechanism === 'damage') {
        let base = effect.value + enemies[0].strength;
        if (enemies[0].weak > 0) base = Math.floor(base * 0.75);
        let dmg = base;
        if (player.vulnerable > 0) dmg = Math.ceil(dmg * 1.5);

        const result = applyDamageToPlayer(player, dmg);
        player = result.player;
        newLog = log(
          { ...combat, log: newLog },
          'enemy',
          `Enemy dealt ${result.taken} damage${result.blocked ? '' : ''}`
        );
        if (result.blocked > 0) {
          newLog = log(
            { ...combat, log: newLog },
            'player',
            `Player blocked ${result.blocked} damage`
          );
        }
        if (result.taken > 0 && player.relics.includes('thornmail_shackles')) {
          enemies[0].bleed += 1;
          newLog = log(
            { ...combat, log: newLog },
            'system',
            'Thornmail Shackles: Enemy gained 1 Bleed'
          );
        }
      } else if (effect.mechanism === 'block') {
        enemies[0].block += calcBlock(effect.value, enemies[0].dexterity);
      } else if (effect.mechanism === 'heal') {
        enemies[0].currentHp = Math.min(enemies[0].maxHp, enemies[0].currentHp + effect.value);
      } else if (effect.mechanism === 'gainStrength') {
        enemies[0].strength += effect.value;
      } else if (effect.mechanism === 'applyWeak') {
        player.weak += effect.value;
        newLog = log({ ...combat, log: newLog }, 'enemy', `Applied ${effect.value} Weak to Player`);
      } else if (effect.mechanism === 'applyVulnerable') {
        player.vulnerable += effect.value;
        newLog = log({ ...combat, log: newLog }, 'enemy', `Applied ${effect.value} Vulnerable to Player`);
      } else if (effect.mechanism === 'applyPoison') {
        player.poison += effect.value;
        newLog = log({ ...combat, log: newLog }, 'enemy', `Applied ${effect.value} Poison to Player`);
      } else if (effect.mechanism === 'applyBleed') {
        player.bleed += effect.value;
      }
    }
  }

  if (player.currentHp <= 0) {
    return finalizeDefeat({
      ...run,
      combat: { ...combat, player, enemies, log: newLog, phase: 'defeat' },
    });
  }

  // 低血量遗物
  const lowHpCheck = checkLowHpRelic({ ...combat, log: newLog }, player);
  player = lowHpCheck.player;
  newLog = lowHpCheck.log;

  // 下一意图
  const actionList = getEnemyActionList(enemyDef, enemies[0].bossPhase);
  enemies[0].actionIndex = (enemies[0].actionIndex + 1) % actionList.length;
  const nextAction = getEnemyIntentFromState(enemyDef, enemies[0]);
  enemies[0].intent = nextAction.intent;
  enemies[0].block = 0;

  // 新回合
  const nextTurn = combat.turn + 1;
  player.block = 0;
  if (player.relics.includes('vow_shield')) {
    player.block += 2;
    newLog = log({ ...combat, log: newLog, turn: nextTurn }, 'system', 'Vow Shield: gained 2 Block');
  }
  player.energy = player.maxEnergy;
  if (player.weak > 0) player.weak -= 1;
  if (player.vulnerable > 0) player.vulnerable -= 1;
  if (player.bleed > 0) {
    const bleedDmg = player.bleed;
    player.bleed -= 1;
    player.currentHp = Math.max(0, player.currentHp - bleedDmg);
    newLog = log({ ...combat, log: newLog }, 'system', `Player took ${bleedDmg} Bleed damage`);
  }

  if (player.currentHp <= 0) {
    return finalizeDefeat({
      ...run,
      combat: { ...combat, player, enemies, log: newLog, phase: 'defeat' },
    });
  }

  const drawResult = drawCards(player, HAND_SIZE, run.seed, nextTurn);
  player = drawResult.player;

  newLog = log({ ...combat, log: newLog, turn: nextTurn }, 'system', `Turn ${nextTurn}:`);
  newLog = log({ ...combat, log: newLog, turn: nextTurn }, 'player', `Player drew ${drawResult.drawn} cards`);
  newLog = log(
    { ...combat, log: newLog, turn: nextTurn },
    'enemy',
    `Enemy intends: ${nextAction.intent.description} (${nextAction.intent.value})`
  );

  const updatedRelicFlags = {
    ...(combat.relicFlags ?? defaultRelicFlags()),
    firstDefenseUsed: false,
    firstAttackUsed: false,
    firstSkillUsed: false,
  };

  const updatedCombat: CombatState = {
    ...combat,
    turn: nextTurn,
    phase: 'player_turn',
    player,
    enemies,
    log: newLog,
    nextAttackBonus: 0,
    relicFlags: updatedRelicFlags,
  };

  return {
    ...run,
    combat: updatedCombat,
    combatLog: [...run.combatLog, ...newLog.slice(combat.log.length)],
  };
}

function mergeDeckBack(player: RunPlayerState): RunPlayerState {
  const deck = [
    ...player.drawPile,
    ...player.hand,
    ...player.discard,
    ...player.exhaustPile,
  ];
  return {
    ...player,
    deck,
    hand: [],
    discard: [],
    drawPile: [],
    exhaustPile: [],
    block: 0,
    energy: player.maxEnergy,
  };
}

function generateRewardCards(
  seed: string,
  classId: string,
  allCards: CardDefinition[],
  nodeType: NodeType = 'normal_combat',
  extraChoices = 0,
  count = 3
): string[] {
  return generateRewardCardIds(seed, classId, allCards, nodeType, count, extraChoices);
}

function finalizeVictory(run: RunState): RunState {
  const combat = run.combat!;
  const player = mergeDeckBack(combat.player);
  let goldReward =
    combat.nodeType === 'boss' ? 100 : combat.nodeType === 'elite_combat' ? 45 : 25;

  if (player.relics.includes('memory_shard')) goldReward += 10;
  if (player.relics.includes('void_lens') && combat.nodeType === 'elite_combat') {
    goldReward += 15;
  }
  if (player.relics.includes('cursed_coin')) {
    goldReward = Math.floor(goldReward * 1.2);
  }
  if (player.relics.includes('memory_crown') && combat.nodeType === 'boss') {
    goldReward += 30;
  }

  const playerWithGold = { ...player, gold: player.gold + goldReward };

  if (combat.nodeType === 'boss') {
    return {
      ...run,
      phase: 'victory',
      player: playerWithGold,
      combat: { ...combat, phase: 'victory', goldReward },
      encounter: null,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    ...run,
    phase: 'reward',
    player: playerWithGold,
    combat: {
      ...combat,
      phase: 'victory',
      goldReward,
    },
    updatedAt: new Date().toISOString(),
  };
}

function finalizeDefeat(run: RunState): RunState {
  const combat = run.combat!;
  return {
    ...run,
    phase: 'defeat',
    player: mergeDeckBack(combat.player),
    combat: { ...combat, phase: 'defeat' },
    updatedAt: new Date().toISOString(),
  };
}

export function prepareRewards(
  run: RunState,
  allCards: CardDefinition[]
): RunState {
  if (run.phase !== 'reward' || !run.combat) return run;
  const nodeType = run.combat.nodeType;
  const rewardCardIds = generateRewardCards(
    `${run.seed}:reward:${run.currentNodeId}`,
    run.player.classId,
    allCards,
    nodeType,
    run.metaBonuses.extraCardChoices
  );
  return {
    ...run,
    combat: { ...run.combat, rewardCardIds },
  };
}

export function selectReward(run: RunState, cardId: string): RunState {
  if (run.phase !== 'reward') return run;
  return {
    ...run,
    phase: 'map',
    player: { ...run.player, deck: [...run.player.deck, cardId] },
    combat: null,
    updatedAt: new Date().toISOString(),
  };
}

export function skipReward(run: RunState): RunState {
  if (run.phase !== 'reward') return run;
  return {
    ...run,
    phase: 'map',
    combat: null,
    updatedAt: new Date().toISOString(),
  };
}

export function getCardFromHand(
  combat: CombatState,
  handIndex: number,
  cards: CardDefinition[]
): CardDefinition | null {
  const cardId = combat.player.hand[handIndex];
  if (!cardId) return null;
  return cards.find((c) => c.id === cardId) ?? null;
}

export function getEffectiveCost(
  combat: CombatState,
  card: CardDefinition,
  handIndex?: number
): number {
  let cost = Math.max(0, card.cost - combat.costReduction);
  if (
    handIndex !== undefined &&
    combat.relicFlags?.demonDiceHandIndex === handIndex
  ) {
    cost = 0;
  }
  return cost;
}

export function canPlayCard(
  combat: CombatState,
  card: CardDefinition,
  handIndex?: number
): boolean {
  return (
    combat.phase === 'player_turn' &&
    combat.player.energy >= getEffectiveCost(combat, card, handIndex)
  );
}
