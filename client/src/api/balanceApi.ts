import type { ClassBalanceReport, GlobalBalanceReport } from '@rcb/shared';

const API_BASE = '/api/balance';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export async function fetchBalanceScenarios() {
  const data = await fetchJson<{ scenarios: import('@rcb/shared').BalanceScenario[] }>(
    '/scenarios'
  );
  return data.scenarios;
}

export async function fetchLastBalanceReport() {
  const data = await fetchJson<{ report: GlobalBalanceReport | null }>('/report');
  return data.report;
}

export async function runGlobalAudit(runsPerCell = 12) {
  return fetchJson<{ ok: boolean; report: GlobalBalanceReport }>('/audit/all', {
    method: 'POST',
    body: JSON.stringify({ runsPerCell }),
  });
}

export async function runClassAudit(classId: string, runsPerCell = 16) {
  return fetchJson<{ ok: boolean; report: ClassBalanceReport }>('/audit/class', {
    method: 'POST',
    body: JSON.stringify({ classId, runsPerCell }),
  });
}

export async function runSingleSim(options: {
  classId: string;
  enemyId: string;
  strategy?: 'greedy' | 'defensive' | 'aggressive';
  deckMode?: 'starter' | 'full_pool';
  runs?: number;
}) {
  return fetchJson<{ ok: boolean; report: import('@rcb/shared').CombatSimReport }>(
    '/simulate',
    { method: 'POST', body: JSON.stringify(options) }
  );
}
