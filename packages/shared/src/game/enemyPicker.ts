import type { NodeType } from '../types/game.js';
import type { EnemyDefinition } from '../types/game.js';
import { pickFromSeed } from '../rng/seededRandom.js';

const NORMAL_ENEMY_IDS = [
  'memory_maggot',
  'broken_guard',
  'fear_crow',
  'dungeon_hound',
  'lost_thief',
  'corrupt_priest',
];

const ELITE_ENEMY_IDS = ['mirror_knight', 'abyss_collector'];

export function pickEnemyId(
  seed: string,
  contentId: string,
  nodeType: NodeType
): string {
  const pool =
    nodeType === 'elite_combat'
      ? ELITE_ENEMY_IDS
      : nodeType === 'boss'
        ? ['memory_devourer']
        : NORMAL_ENEMY_IDS;
  return pickFromSeed(`${seed}:enemy:${contentId}`, pool);
}

export function getEnemyDefinition(
  enemies: EnemyDefinition[],
  id: string
): EnemyDefinition {
  const found = enemies.find((e) => e.id === id);
  if (!found) throw new Error(`Enemy not found: ${id}`);
  return found;
}
