import type { GeneratedClassDraft, GeneratedClassPackInput } from '@rcb/shared';

const API_BASE = '/api/llm';

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

export async function fetchLlmStatus() {
  return fetchJson<{
    hasApiKey: boolean;
    model: string;
    baseUrl: string;
    imageApiSeparate: boolean;
    note: string;
  }>('/status');
}

export async function fetchDrafts() {
  const data = await fetchJson<{ drafts: GeneratedClassDraft[] }>('/drafts');
  return data.drafts;
}

export async function fetchDraft(id: string) {
  const data = await fetchJson<{ draft: GeneratedClassDraft }>(`/drafts/${id}`);
  return data.draft;
}

export async function generateClassPack(options: {
  theme: string;
  nameHint?: string;
  classIdPrefix?: string;
  cardCount?: number;
  userPrompt?: string;
}) {
  return fetchJson<{ ok: boolean; draft: GeneratedClassDraft; message: string }>(
    '/generate-class',
    { method: 'POST', body: JSON.stringify(options) }
  );
}

export async function revalidateDraft(id: string) {
  return fetchJson<{ ok: boolean; draft: GeneratedClassDraft }>(
    `/drafts/${id}/revalidate`,
    { method: 'POST', body: '{}' }
  );
}

export async function approveDraft(id: string, unlockClass = true) {
  return fetchJson<{ ok: boolean; classId: string; cardFile: string; message: string }>(
    `/drafts/${id}/approve`,
    { method: 'POST', body: JSON.stringify({ unlockClass }) }
  );
}

export async function deleteDraft(id: string) {
  return fetchJson<{ ok: boolean }>(`/drafts/${id}`, { method: 'DELETE' });
}

export function getPackFromDraft(draft: GeneratedClassDraft): GeneratedClassPackInput | null {
  if (!draft.validation.schemaValid) return null;
  return draft.pack as GeneratedClassPackInput;
}
