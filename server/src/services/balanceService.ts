import {
  DEFAULT_BALANCE_SCENARIOS,
  runClassBalanceSuite,
  runGlobalBalanceReport,
  runCombatSimulations,
  type GlobalBalanceReport,
} from '@rcb/shared';
import { readJsonFile, writeJsonFile } from './storage.js';
import { getCards, getClasses, getEnemies } from './gameData.js';

const LAST_REPORT_FILE = 'balance/lastReport.json';

let cachedReport: GlobalBalanceReport | null = null;

export function getBalanceScenarios() {
  return DEFAULT_BALANCE_SCENARIOS;
}

export async function getLastBalanceReport(): Promise<GlobalBalanceReport | null> {
  if (cachedReport) return cachedReport;
  try {
    cachedReport = await readJsonFile<GlobalBalanceReport>(LAST_REPORT_FILE);
    return cachedReport;
  } catch {
    return null;
  }
}

async function saveReport(report: GlobalBalanceReport): Promise<void> {
  cachedReport = report;
  await writeJsonFile(LAST_REPORT_FILE, report);
}

export async function runSingleSimulation(options: {
  classId: string;
  enemyId: string;
  strategy?: 'greedy' | 'defensive' | 'aggressive';
  deckMode?: 'starter' | 'full_pool';
  runs?: number;
}) {
  const [classes, cards, enemies] = await Promise.all([
    getClasses(),
    getCards(),
    getEnemies(),
  ]);
  const classDef = classes.find((c) => c.id === options.classId);
  const enemy = enemies.find((e) => e.id === options.enemyId);
  if (!classDef) throw new Error(`Class not found: ${options.classId}`);
  if (!enemy) throw new Error(`Enemy not found: ${options.enemyId}`);

  const classCards = cards.filter((c) => c.classId === classDef.id);
  const scenario = DEFAULT_BALANCE_SCENARIOS.find((s) => s.enemyId === enemy.id);

  const report = runCombatSimulations(
    classDef,
    classCards,
    enemy,
    options.runs ?? 20,
    {
      strategy: options.strategy ?? 'greedy',
      deckMode: options.deckMode ?? 'starter',
      nodeType: scenario?.nodeType ?? (enemy.isBoss ? 'boss' : enemy.isElite ? 'elite_combat' : 'normal_combat'),
    }
  );

  if (scenario) {
    report.passed = report.winRate >= scenario.expectedWinRate.min && report.winRate <= scenario.expectedWinRate.max;
  }

  return report;
}

export async function auditClass(classId: string, runsPerCell = 16) {
  const [classes, cards, enemies] = await Promise.all([
    getClasses(),
    getCards(),
    getEnemies(),
  ]);
  const classDef = classes.find((c) => c.id === classId);
  if (!classDef) throw new Error(`Class not found: ${classId}`);
  return runClassBalanceSuite(classDef, cards, enemies, { runsPerCell });
}

export async function auditAll(options: { runsPerCell?: number } = {}) {
  const [classes, cards, enemies] = await Promise.all([
    getClasses(),
    getCards(),
    getEnemies(),
  ]);
  const report = runGlobalBalanceReport(classes, cards, enemies, {
    runsPerCell: options.runsPerCell ?? 12,
  });
  await saveReport(report);
  return report;
}
