import type {
  ClassDefinition,
  MetaProgressBonuses,
  RunPlayerState,
  RunState,
} from '../types/game.js';
import { generateDungeonMap, generateSeed } from '../rng/seededRandom.js';

export function createDefaultMetaBonuses(): MetaProgressBonuses {
  return {
    bonusMaxHp: 0,
    bonusStartingGold: 0,
    unlockedClasses: ['blood_blade_hunter', 'rune_mage', 'oath_knight'],
    extraCardChoices: 0,
    unlockedRelicPool: [],
  };
}

export function createInitialPlayerState(
  classDef: ClassDefinition,
  meta: MetaProgressBonuses
): RunPlayerState {
  const maxHp = classDef.maxHp + meta.bonusMaxHp;
  const deck = [...classDef.starterDeck];

  return {
    classId: classDef.id,
    currentHp: maxHp,
    maxHp,
    gold: classDef.startingGold + meta.bonusStartingGold,
    deck,
    hand: [],
    discard: [],
    drawPile: [],
    exhaustPile: [],
    relics: [],
    upgradedCards: [],
    energy: 3,
    maxEnergy: 3,
    block: 0,
    strength: 0,
    dexterity: 0,
    weak: 0,
    vulnerable: 0,
    bleed: 0,
    poison: 0,
  };
}

export function createNewRun(
  classDef: ClassDefinition,
  meta: MetaProgressBonuses = createDefaultMetaBonuses(),
  seed?: string,
  startingRelicId?: string
): RunState {
  const runSeed = seed ?? generateSeed();
  const map = generateDungeonMap(runSeed);
  const now = new Date().toISOString();

  let player = createInitialPlayerState(classDef, meta);
  if (startingRelicId && classDef.recommendedRelics.includes(startingRelicId)) {
    player = { ...player, relics: [...player.relics, startingRelicId] };
    if (startingRelicId === 'cursed_coin') {
      player = {
        ...player,
        maxHp: Math.max(1, player.maxHp - 5),
        currentHp: Math.min(player.currentHp, Math.max(1, player.maxHp - 5)),
      };
    }
  }

  return {
    id: `run_${runSeed}_${Date.now()}`,
    seed: runSeed,
    phase: 'map',
    player,
    map,
    currentNodeId: null,
    floor: 1,
    combatLog: [],
    combat: null,
    encounter: null,
    runResult: null,
    metaBonuses: meta,
    createdAt: now,
    updatedAt: now,
  };
}

export function getAvailableMapNodes(run: RunState) {
  return run.map.nodes.filter((n) => n.available && !n.visited);
}

export function selectMapNode(run: RunState, nodeId: string): RunState {
  const node = run.map.nodes.find((n) => n.id === nodeId);
  if (!node || !node.available || node.visited) {
    return run;
  }

  const updatedNodes = run.map.nodes.map((n) => {
    if (n.id === nodeId) {
      return { ...n, visited: true, available: false };
    }
    // 解锁下一层连接节点
    if (node.connections.includes(n.id)) {
      return { ...n, available: true };
    }
    // 同层其他节点不可选
    if (n.layer === node.layer && n.id !== nodeId) {
      return { ...n, available: false };
    }
    return n;
  });

  const phaseMap: Record<string, RunState['phase']> = {
    normal_combat: 'combat',
    elite_combat: 'combat',
    boss: 'boss',
    shop: 'shop',
    rest: 'rest',
    treasure: 'treasure',
    random_event: 'event',
  };

  return {
    ...run,
    currentNodeId: nodeId,
    phase: phaseMap[node.type] ?? 'map',
    map: { ...run.map, nodes: updatedNodes },
    updatedAt: new Date().toISOString(),
  };
}

export const NODE_TYPE_LABELS: Record<string, string> = {
  normal_combat: '战斗',
  elite_combat: '精英',
  random_event: '事件',
  shop: '商店',
  rest: '休息',
  treasure: '宝箱',
  boss: 'Boss',
};
