import type { CardEffect, EffectMechanism } from '../types/game.js';
import { COST_BUDGET_LIMITS, MECHANISM_POWER_VALUES } from '../types/game.js';

export interface PowerBudgetResult {
  calculated: number;
  limit: number;
  valid: boolean;
  overBy: number;
}

export function calculateEffectPower(effect: CardEffect): number {
  const base = MECHANISM_POWER_VALUES[effect.mechanism as EffectMechanism] ?? 0;
  return base * effect.value;
}

export function calculateCardPowerBudget(effects: CardEffect[]): number {
  return effects.reduce((sum, e) => sum + calculateEffectPower(e), 0);
}

export function validatePowerBudget(
  cost: number,
  effects: CardEffect[],
  declaredBudget?: number
): PowerBudgetResult {
  const calculated = calculateCardPowerBudget(effects);
  const limit = COST_BUDGET_LIMITS[cost] ?? COST_BUDGET_LIMITS[3];
  const overBy = Math.max(0, calculated - limit);
  const budgetMatch =
    declaredBudget === undefined || Math.abs(declaredBudget - calculated) < 0.01;

  return {
    calculated,
    limit,
    valid: overBy === 0 && budgetMatch,
    overBy,
  };
}

export interface BudgetFixSuggestion {
  action: 'reduce_values' | 'increase_cost' | 'mark_invalid';
  suggestedCost?: number;
  adjustedEffects?: CardEffect[];
}

export function suggestBudgetFix(
  cost: number,
  effects: CardEffect[]
): BudgetFixSuggestion {
  const result = validatePowerBudget(cost, effects);
  if (result.valid) {
    return { action: 'reduce_values', adjustedEffects: effects };
  }

  // 尝试提高费用
  for (let newCost = cost + 1; newCost <= 3; newCost++) {
    const newLimit = COST_BUDGET_LIMITS[newCost];
    if (result.calculated <= newLimit) {
      return { action: 'increase_cost', suggestedCost: newCost, adjustedEffects: effects };
    }
  }

  // 按比例削弱数值
  const scale = result.limit / result.calculated;
  const adjustedEffects = effects.map((e) => ({
    ...e,
    value: Math.max(1, Math.floor(e.value * scale)),
  }));

  const adjustedResult = validatePowerBudget(cost, adjustedEffects);
  if (adjustedResult.valid) {
    return { action: 'reduce_values', adjustedEffects };
  }

  return { action: 'mark_invalid' };
}
