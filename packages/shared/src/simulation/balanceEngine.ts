import type { CardDefinition, ClassDefinition, EnemyDefinition, NodeType } from '../types/game.js';
import type { CardEffect } from '../types/game.js';
import {
  calculateCardPowerBudget,
  suggestBudgetFix,
  validatePowerBudget,
} from '../validation/powerBudget.js';
import {
  evaluateSimReport,
  runCombatSimulations,
  type CombatSimReport,
  type SimDeckMode,
  type SimStrategy,
} from './combatSim.js';

export interface BalanceScenario {
  id: string;
  label: string;
  enemyId: string;
  nodeType: NodeType;
  expectedWinRate: { min: number; max: number };
  deckMode: SimDeckMode;
}

export const DEFAULT_BALANCE_SCENARIOS: BalanceScenario[] = [
  {
    id: 'normal_maggot',
    label: '普通·记忆蛆虫',
    enemyId: 'memory_maggot',
    nodeType: 'normal_combat',
    expectedWinRate: { min: 0.65, max: 0.98 },
    deckMode: 'starter',
  },
  {
    id: 'normal_hound',
    label: '普通·地下城猎犬',
    enemyId: 'dungeon_hound',
    nodeType: 'normal_combat',
    expectedWinRate: { min: 0.55, max: 0.95 },
    deckMode: 'starter',
  },
  {
    id: 'elite_mirror',
    label: '精英·镜中骑士',
    enemyId: 'mirror_knight',
    nodeType: 'elite_combat',
    expectedWinRate: { min: 0.2, max: 0.75 },
    deckMode: 'starter',
  },
  {
    id: 'elite_abyss',
    label: '精英·深渊收藏家',
    enemyId: 'abyss_collector',
    nodeType: 'elite_combat',
    expectedWinRate: { min: 0.15, max: 0.7 },
    deckMode: 'starter',
  },
  {
    id: 'boss_devourer',
    label: 'Boss·遗迹吞忆者',
    enemyId: 'memory_devourer',
    nodeType: 'boss',
    expectedWinRate: { min: 0.05, max: 0.45 },
    deckMode: 'starter',
  },
  {
    id: 'full_pool_elite',
    label: '全卡池·镜中骑士',
    enemyId: 'mirror_knight',
    nodeType: 'elite_combat',
    expectedWinRate: { min: 0.35, max: 0.9 },
    deckMode: 'full_pool',
  },
];

export interface CardAuditItem {
  cardId: string;
  cardName: string;
  classId: string;
  cost: number;
  rarity: string;
  calculated: number;
  limit: number;
  utilization: number;
  valid: boolean;
  fixAction?: string;
}

export type BalanceRating = 'too_easy' | 'balanced' | 'too_hard' | 'broken';

export interface BalanceSimCell {
  scenarioId: string;
  scenarioLabel: string;
  enemyId: string;
  strategy: SimStrategy;
  deckMode: SimDeckMode;
  report: CombatSimReport;
  rating: BalanceRating;
  expectedWinRate: { min: number; max: number };
}

export interface ClassBalanceReport {
  classId: string;
  className: string;
  runsPerCell: number;
  cells: BalanceSimCell[];
  cardAudit: CardAuditItem[];
  overallScore: number;
  passed: boolean;
  suggestions: string[];
  generatedAt: string;
}

export interface GlobalBalanceReport {
  runsPerCell: number;
  strategies: SimStrategy[];
  classes: ClassBalanceReport[];
  allCardAudit: CardAuditItem[];
  overallScore: number;
  passed: boolean;
  suggestions: string[];
  generatedAt: string;
}

export function auditCardPool(cards: CardDefinition[]): CardAuditItem[] {
  return cards.map((card) => {
    const calculated = calculateCardPowerBudget(card.effects as CardEffect[]);
    const budget = validatePowerBudget(card.cost, card.effects as CardEffect[], card.powerBudget);
    const fix = budget.valid ? null : suggestBudgetFix(card.cost, card.effects as CardEffect[]);
    let fixAction: string | undefined;
    if (fix?.action === 'increase_cost') fixAction = `建议费用提升至 ${fix.suggestedCost}`;
    else if (fix?.action === 'reduce_values') fixAction = '建议等比削弱效果数值';
    else if (fix?.action === 'mark_invalid') fixAction = '无法自动修复，需重新设计';

    return {
      cardId: card.id,
      cardName: card.name,
      classId: card.classId,
      cost: card.cost,
      rarity: card.rarity,
      calculated,
      limit: budget.limit,
      utilization: budget.limit > 0 ? calculated / budget.limit : 0,
      valid: budget.valid,
      fixAction,
    };
  });
}

function rateSimCell(
  report: CombatSimReport,
  expected: { min: number; max: number }
): BalanceRating {
  if (report.timeouts > report.runs * 0.4) return 'broken';
  if (report.winRate > expected.max + 0.05) return 'too_easy';
  if (report.winRate < expected.min - 0.05) return 'too_hard';
  if (evaluateSimReport(report, expected)) return 'balanced';
  if (report.winRate > expected.max) return 'too_easy';
  return 'too_hard';
}

export function runClassBalanceSuite(
  classDef: ClassDefinition,
  cards: CardDefinition[],
  enemies: EnemyDefinition[],
  options: {
    scenarios?: BalanceScenario[];
    strategies?: SimStrategy[];
    runsPerCell?: number;
  } = {}
): ClassBalanceReport {
  const scenarios = options.scenarios ?? DEFAULT_BALANCE_SCENARIOS;
  const strategies: SimStrategy[] = options.strategies ?? ['greedy', 'defensive'];
  const runsPerCell = options.runsPerCell ?? 16;
  const classCards = cards.filter((c) => c.classId === classDef.id);
  const cells: BalanceSimCell[] = [];

  for (const scenario of scenarios) {
    const enemy = enemies.find((e) => e.id === scenario.enemyId);
    if (!enemy) continue;

    for (const strategy of strategies) {
      const report = runCombatSimulations(classDef, classCards, enemy, runsPerCell, {
        strategy,
        deckMode: scenario.deckMode,
        nodeType: scenario.nodeType,
      });
      cells.push({
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        enemyId: enemy.id,
        strategy,
        deckMode: scenario.deckMode,
        report,
        rating: rateSimCell(report, scenario.expectedWinRate),
        expectedWinRate: scenario.expectedWinRate,
      });
    }
  }

  const cardAudit = auditCardPool(classCards);
  const suggestions = buildClassSuggestions(cells, cardAudit);
  const overallScore = scoreClassReport(cells, cardAudit);
  const balancedCount = cells.filter((c) => c.rating === 'balanced').length;
  const brokenCount = cells.filter((c) => c.rating === 'broken').length;
  const passed =
    cardAudit.every((c) => c.valid) &&
    brokenCount === 0 &&
    balancedCount >= Math.ceil(cells.length * 0.5);

  return {
    classId: classDef.id,
    className: classDef.name,
    runsPerCell,
    cells,
    cardAudit,
    overallScore,
    passed,
    suggestions,
    generatedAt: new Date().toISOString(),
  };
}

export function runGlobalBalanceReport(
  classes: ClassDefinition[],
  cards: CardDefinition[],
  enemies: EnemyDefinition[],
  options: { runsPerCell?: number; strategies?: SimStrategy[] } = {}
): GlobalBalanceReport {
  const classReports = classes.map((cls) =>
    runClassBalanceSuite(cls, cards, enemies, options)
  );
  const allCardAudit = auditCardPool(cards);
  const suggestions = [
    ...new Set(classReports.flatMap((r) => r.suggestions)),
    ...buildGlobalCardSuggestions(allCardAudit),
  ];
  const overallScore =
    classReports.length > 0
      ? Math.round(classReports.reduce((s, r) => s + r.overallScore, 0) / classReports.length)
      : 0;
  const passed = classReports.every((r) => r.passed) && allCardAudit.every((c) => c.valid);

  return {
    runsPerCell: options.runsPerCell ?? 16,
    strategies: options.strategies ?? ['greedy', 'defensive'],
    classes: classReports,
    allCardAudit,
    overallScore,
    passed,
    suggestions,
    generatedAt: new Date().toISOString(),
  };
}

function scoreClassReport(cells: BalanceSimCell[], cardAudit: CardAuditItem[]): number {
  if (cells.length === 0) return 0;
  const balancedRatio = cells.filter((c) => c.rating === 'balanced').length / cells.length;
  const budgetRatio = cardAudit.filter((c) => c.valid).length / Math.max(cardAudit.length, 1);
  const penalty =
    cells.filter((c) => c.rating === 'broken').length * 0.15 +
    cells.filter((c) => c.rating === 'too_hard').length * 0.08;
  return Math.max(0, Math.min(100, Math.round((balancedRatio * 0.65 + budgetRatio * 0.35 - penalty) * 100)));
}

function buildClassSuggestions(cells: BalanceSimCell[], cardAudit: CardAuditItem[]): string[] {
  const tips: string[] = [];
  const tooEasy = cells.filter((c) => c.rating === 'too_easy');
  const tooHard = cells.filter((c) => c.rating === 'too_hard');

  if (tooEasy.length > 0) {
    tips.push(
      `${tooEasy[0].scenarioLabel} 过简单（胜率 ${(tooEasy[0].report.winRate * 100).toFixed(0)}%）：考虑削弱 starter 攻击或提高敌人压力`
    );
  }
  if (tooHard.length > 0) {
    tips.push(
      `${tooHard[0].scenarioLabel} 过难（胜率 ${(tooHard[0].report.winRate * 100).toFixed(0)}%）：考虑增强防御牌或降低 enemy 伤害预期`
    );
  }

  const invalidCards = cardAudit.filter((c) => !c.valid);
  if (invalidCards.length > 0) {
    tips.push(` ${invalidCards.length} 张卡 Power Budget 超标，首张：${invalidCards[0].cardName}（${invalidCards[0].fixAction ?? '需调整'}）`);
  }

  const overfilled = cardAudit.filter((c) => c.valid && c.utilization > 0.95);
  if (overfilled.length >= 3) {
    tips.push(`多张卡接近预算上限（${overfilled.length} 张），整体卡组可能偏强`);
  }

  return tips;
}

function buildGlobalCardSuggestions(audit: CardAuditItem[]): string[] {
  const tips: string[] = [];
  const invalid = audit.filter((c) => !c.valid);
  if (invalid.length > 0) {
    tips.push(`全局：${invalid.length} 张卡预算校验失败，请优先修复`);
  }
  return tips;
}

/** Phase 6 校验用：对单敌人快速模拟 */
export function runQuickBalanceCheck(
  classDef: ClassDefinition,
  cards: CardDefinition[],
  enemy: EnemyDefinition,
  runs = 12
): CombatSimReport {
  return runCombatSimulations(classDef, cards, enemy, runs, {
    strategy: 'greedy',
    deckMode: 'starter',
    nodeType: enemy.isBoss ? 'boss' : enemy.isElite ? 'elite_combat' : 'normal_combat',
  });
}
