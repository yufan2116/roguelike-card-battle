import type { MetaProgress, RunResult, RunState } from '../types/game.js';
import { countVisitedNodes } from './nodeEncounter.js';

export function calculateSouls(run: RunState, victory: boolean): number {
  const visited = countVisitedNodes(run);
  const base = victory ? 50 : 10;
  const goldBonus = Math.floor(run.player.gold / 20);
  const relicBonus = run.player.relics.length * 5;
  const floorBonus = visited * 3;
  return base + goldBonus + relicBonus + floorBonus;
}

export function buildRunResult(run: RunState, victory: boolean): RunResult {
  return {
    soulsEarned: calculateSouls(run, victory),
    goldCollected: run.player.gold,
    nodesVisited: countVisitedNodes(run),
    victory,
  };
}

export function applyRunResultToMeta(
  meta: MetaProgress,
  result: RunResult
): MetaProgress {
  return {
    totalRuns: meta.totalRuns + 1,
    victories: meta.victories + (result.victory ? 1 : 0),
    souls: meta.souls + result.soulsEarned,
    upgrades: { ...meta.upgrades },
  };
}

export function finalizeRunWithMeta(
  run: RunState,
  meta: MetaProgress,
  victory: boolean
): { run: RunState; meta: MetaProgress } {
  const runResult = buildRunResult(run, victory);
  const updatedMeta = applyRunResultToMeta(meta, runResult);

  return {
    run: {
      ...run,
      runResult,
      phase: victory ? 'victory' : 'defeat',
      combat: null,
      encounter: null,
      updatedAt: new Date().toISOString(),
    },
    meta: updatedMeta,
  };
}
