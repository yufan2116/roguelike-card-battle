import { GeneratedClassPackSchema, type GeneratedClassPackInput } from '../schemas/gameSchemas.js';
import type { CardDefinition, CardEffect, ClassDefinition, EnemyDefinition } from '../types/game.js';
import { validatePowerBudget, calculateCardPowerBudget } from './powerBudget.js';
import { runCombatSimulations, evaluateSimReport, type CombatSimReport } from '../simulation/combatSim.js';
import { DEFAULT_BALANCE_SCENARIOS } from '../simulation/balanceEngine.js';

export interface CardBudgetIssue {
  cardId: string;
  cardName: string;
  calculated: number;
  limit: number;
  declared: number;
  valid: boolean;
}

export interface GenerationValidationReport {
  schemaValid: boolean;
  schemaErrors: string[];
  cardBudgetIssues: CardBudgetIssue[];
  starterDeckValid: boolean;
  starterDeckErrors: string[];
  relicRefsValid: boolean;
  invalidRelicIds: string[];
  duplicateCardIds: string[];
  classIdMismatch: string[];
  simulation: CombatSimReport | null;
  overallValid: boolean;
  warnings: string[];
}

export interface ValidatePackOptions {
  knownRelicIds: string[];
  referenceEnemy?: EnemyDefinition;
  runSimulation?: boolean;
  simRuns?: number;
}

export function validateGeneratedClassPack(
  raw: unknown,
  options: ValidatePackOptions
): { pack: GeneratedClassPackInput | null; report: GenerationValidationReport } {
  const report: GenerationValidationReport = {
    schemaValid: false,
    schemaErrors: [],
    cardBudgetIssues: [],
    starterDeckValid: true,
    starterDeckErrors: [],
    relicRefsValid: true,
    invalidRelicIds: [],
    duplicateCardIds: [],
    classIdMismatch: [],
    simulation: null,
    overallValid: false,
    warnings: [],
  };

  const parsed = GeneratedClassPackSchema.safeParse(raw);
  if (!parsed.success) {
    report.schemaErrors = parsed.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`
    );
    return { pack: null, report };
  }

  report.schemaValid = true;
  const pack = parsed.data;

  const idSet = new Set<string>();
  for (const card of pack.cards) {
    if (idSet.has(card.id)) report.duplicateCardIds.push(card.id);
    idSet.add(card.id);
    if (card.classId !== pack.class.id) {
      report.classIdMismatch.push(`${card.id} classId=${card.classId}`);
    }
  }

  for (const card of pack.cards) {
    const budget = validatePowerBudget(card.cost, card.effects as CardEffect[], card.powerBudget);
    const calculated = calculateCardPowerBudget(card.effects as CardEffect[]);
    if (!budget.valid) {
      report.cardBudgetIssues.push({
        cardId: card.id,
        cardName: card.name,
        calculated,
        limit: budget.limit,
        declared: card.powerBudget,
        valid: false,
      });
    }
    if (card.upgradedEffects) {
      const upBudget = validatePowerBudget(
        card.cost,
        card.upgradedEffects as CardEffect[],
        undefined
      );
      if (!upBudget.valid) {
        report.warnings.push(`升级效果超预算: ${card.id}`);
      }
    }
  }

  const cardIds = new Set(pack.cards.map((c) => c.id));
  for (const deckId of pack.class.starterDeck) {
    if (!cardIds.has(deckId)) {
      report.starterDeckValid = false;
      report.starterDeckErrors.push(`starterDeck 引用未知卡牌: ${deckId}`);
    }
  }

  const starterCards = pack.class.starterDeck.map((id) => pack.cards.find((c) => c.id === id)!);
  const hasAttack = starterCards.some((c) => c?.type === 'attack');
  const hasDefense = starterCards.some((c) => c?.type === 'defense');
  if (!hasAttack || !hasDefense) {
    report.starterDeckValid = false;
    report.starterDeckErrors.push('starterDeck 需包含至少一张 attack 与 defense 卡');
  }

  for (const relicId of pack.class.recommendedRelics) {
    if (!options.knownRelicIds.includes(relicId)) {
      report.relicRefsValid = false;
      report.invalidRelicIds.push(relicId);
    }
  }

  for (const relicId of pack.recommendedRelics) {
    if (!options.knownRelicIds.includes(relicId)) {
      report.relicRefsValid = false;
      if (!report.invalidRelicIds.includes(relicId)) {
        report.invalidRelicIds.push(relicId);
      }
    }
  }

  if (options.runSimulation !== false && options.referenceEnemy) {
    const scenario =
      DEFAULT_BALANCE_SCENARIOS.find((s) => s.enemyId === options.referenceEnemy!.id) ??
      DEFAULT_BALANCE_SCENARIOS.find((s) => s.id === 'elite_mirror')!;
    report.simulation = runCombatSimulations(
      pack.class as ClassDefinition,
      pack.cards as CardDefinition[],
      options.referenceEnemy,
      options.simRuns ?? 12,
      { strategy: 'greedy', deckMode: 'starter', nodeType: scenario.nodeType }
    );
    report.simulation.passed = evaluateSimReport(
      report.simulation,
      scenario.expectedWinRate
    );
    if (!report.simulation.passed) {
      report.warnings.push(
        `战斗模拟未通过：胜率 ${(report.simulation.winRate * 100).toFixed(0)}%，期望 ${(scenario.expectedWinRate.min * 100).toFixed(0)}%~${(scenario.expectedWinRate.max * 100).toFixed(0)}%`
      );
    }
  }

  report.overallValid =
    report.schemaValid &&
    report.cardBudgetIssues.length === 0 &&
    report.starterDeckValid &&
    report.relicRefsValid &&
    report.duplicateCardIds.length === 0 &&
    report.classIdMismatch.length === 0 &&
    (report.simulation === null || report.simulation.passed);

  return { pack, report };
}
