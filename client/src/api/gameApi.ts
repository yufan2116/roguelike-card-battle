import type {
  CardDefinition,
  ClassDefinition,
  MetaProgress,
  MetaUpgradeId,
  RelicDefinition,
  RunState,
  SaveSlotSummary,
} from '@rcb/shared';

const API_BASE = '/api/game';

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

export async function fetchClasses(): Promise<ClassDefinition[]> {
  const data = await fetchJson<{ classes: ClassDefinition[] }>('/classes');
  return data.classes;
}

export async function fetchCards(): Promise<CardDefinition[]> {
  const data = await fetchJson<{ cards: CardDefinition[] }>('/cards');
  return data.cards;
}

export async function fetchRelics(): Promise<RelicDefinition[]> {
  const data = await fetchJson<{ relics: RelicDefinition[] }>('/relics');
  return data.relics;
}

export async function fetchMeta(): Promise<MetaProgress> {
  const data = await fetchJson<{ meta: MetaProgress }>('/meta');
  return data.meta;
}

export async function startRun(
  classId: string,
  seed?: string,
  startingRelicId?: string
): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>('/runs', {
    method: 'POST',
    body: JSON.stringify({ classId, seed, startingRelicId }),
  });
  return data.run;
}

export async function fetchRun(runId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}`);
  return data.run;
}

export async function selectMapNode(runId: string, nodeId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/select-node`, {
    method: 'POST',
    body: JSON.stringify({ nodeId }),
  });
  return data.run;
}

export async function playCombatCard(runId: string, handIndex: number): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/combat/play-card`, {
    method: 'POST',
    body: JSON.stringify({ handIndex }),
  });
  return data.run;
}

export async function endCombatTurn(runId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/combat/end-turn`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return data.run;
}

export async function selectRewardCard(runId: string, cardId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/reward/select`, {
    method: 'POST',
    body: JSON.stringify({ cardId }),
  });
  return data.run;
}

export async function skipReward(runId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/reward/skip`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return data.run;
}

export async function leaveEncounter(runId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/encounter/leave`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return data.run;
}

export async function buyShopItem(runId: string, itemKey: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/shop/buy`, {
    method: 'POST',
    body: JSON.stringify({ itemKey }),
  });
  return data.run;
}

export async function restHeal(runId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/rest/heal`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return data.run;
}

export async function restUpgradeCard(runId: string, cardId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/rest/upgrade-card`, {
    method: 'POST',
    body: JSON.stringify({ cardId }),
  });
  return data.run;
}

export async function restUpgrade(runId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/rest/upgrade`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return data.run;
}

export async function claimTreasure(runId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/treasure/claim`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return data.run;
}

export async function chooseEvent(runId: string, choiceId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/event/choose`, {
    method: 'POST',
    body: JSON.stringify({ choiceId }),
  });
  return data.run;
}

export function getImageUrl(imagePath?: string): string {
  if (!imagePath) return '/assets/placeholder.svg';
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath.startsWith('/') ? imagePath : `/assets/${imagePath}`;
}

export async function fetchSaveSlots(): Promise<SaveSlotSummary[]> {
  const data = await fetchJson<{ saves: SaveSlotSummary[] }>('/saves');
  return data.saves;
}

export async function abandonRun(runId: string): Promise<RunState> {
  const data = await fetchJson<{ run: RunState }>(`/runs/${runId}/abandon`, {
    method: 'POST',
    body: '{}',
  });
  return data.run;
}

export async function deleteSave(runId: string): Promise<void> {
  await fetchJson<{ ok: boolean }>(`/runs/${runId}`, { method: 'DELETE' });
}

export async function purchaseMetaUpgrade(upgradeId: MetaUpgradeId) {
  return fetchJson<{ ok: boolean; meta: MetaProgress; message: string }>('/meta/purchase', {
    method: 'POST',
    body: JSON.stringify({ upgradeId }),
  });
}
