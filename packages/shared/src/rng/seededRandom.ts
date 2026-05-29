import seedrandom from 'seedrandom';
import type { DungeonMap, MapNode, NodeType } from '../types/game.js';

const NODE_TYPES_BY_LAYER: NodeType[][] = [
  ['normal_combat', 'random_event', 'shop'],
  ['normal_combat', 'elite_combat', 'rest'],
  ['normal_combat', 'treasure', 'random_event'],
  ['elite_combat', 'rest', 'shop'],
  ['normal_combat', 'treasure', 'random_event'],
  ['boss'],
];

const LAYER_COUNT = 6;
const NODES_PER_LAYER = 3;

function pickNodeType(rng: seedrandom.PRNG, layer: number): NodeType {
  if (layer === LAYER_COUNT - 1) return 'boss';
  const pool = NODE_TYPES_BY_LAYER[layer] ?? ['normal_combat'];
  return pool[Math.floor(rng() * pool.length)];
}

export function createSeededRng(seed: string): seedrandom.PRNG {
  return seedrandom(seed);
}

export function generateSeed(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export function generateDungeonMap(seed: string): DungeonMap {
  const rng = createSeededRng(`map:${seed}`);
  const nodes: MapNode[] = [];
  let nodeCounter = 0;

  for (let layer = 0; layer < LAYER_COUNT; layer++) {
    for (let col = 0; col < NODES_PER_LAYER; col++) {
      const id = `node_${layer}_${col}_${nodeCounter++}`;
      const type = pickNodeType(rng, layer);
      nodes.push({
        id,
        layer,
        column: col,
        type,
        connections: [],
        visited: false,
        available: layer === 0,
        contentId: `${type}_${rng().toString(36).slice(2, 8)}`,
      });
    }
  }

  // 连接：每层节点连到下一层相邻列
  for (let layer = 0; layer < LAYER_COUNT - 1; layer++) {
    const currentLayerNodes = nodes.filter((n) => n.layer === layer);
    const nextLayerNodes = nodes.filter((n) => n.layer === layer + 1);

    for (const node of currentLayerNodes) {
      const candidates = nextLayerNodes.filter(
        (n) => Math.abs(n.column - node.column) <= 1
      );
      // 至少连 1 条，最多连 2 条
      const connectCount = 1 + (rng() > 0.5 ? 1 : 0);
      const shuffled = [...candidates].sort(() => rng() - 0.5);
      node.connections = shuffled.slice(0, connectCount).map((n) => n.id);
    }
  }

  const bossNode = nodes.find((n) => n.type === 'boss')!;
  return {
    seed,
    layers: LAYER_COUNT,
    nodes,
    bossNodeId: bossNode.id,
  };
}

export function pickFromSeed<T>(seed: string, pool: T[], index = 0): T {
  const rng = createSeededRng(`${seed}:${index}`);
  return pool[Math.floor(rng() * pool.length)];
}

export function shuffleWithSeed<T>(seed: string, array: T[]): T[] {
  const rng = createSeededRng(seed);
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
