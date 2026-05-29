import {
  createEventId,
  normalizeGeneratedClassPack,
  validateGeneratedClassPack,
  type GeneratedClassDraft,
  type DraftsRegistry,
  type GeneratedClassPackInput,
} from '@rcb/shared';
import { callLlmForClassPack } from './llmService.js';
import { readJsonFile, writeJsonFile } from './storage.js';
import { listCardPoolFiles } from './cardFileRegistry.js';
import { invalidateImageRegistryCache } from './imageAssets.js';

const DRAFTS_FILE = 'generated/drafts.json';

interface ClassesFile {
  classes: import('@rcb/shared').ClassDefinition[];
}

interface CardsFile {
  cards: import('@rcb/shared').CardDefinition[];
}

interface MetaFile {
  meta: import('@rcb/shared').MetaProgress;
}

let draftsCache: DraftsRegistry | null = null;

async function loadDrafts(): Promise<DraftsRegistry> {
  if (draftsCache) return draftsCache;
  try {
    draftsCache = await readJsonFile<DraftsRegistry>(DRAFTS_FILE);
  } catch {
    draftsCache = { drafts: [] };
    await saveDrafts(draftsCache);
  }
  return draftsCache!;
}

async function saveDrafts(registry: DraftsRegistry): Promise<void> {
  draftsCache = registry;
  await writeJsonFile(DRAFTS_FILE, registry);
}

export async function listDrafts(): Promise<GeneratedClassDraft[]> {
  const registry = await loadDrafts();
  return registry.drafts.filter((d) => d.status !== 'approved');
}

export async function getDraft(id: string): Promise<GeneratedClassDraft | null> {
  const registry = await loadDrafts();
  return registry.drafts.find((d) => d.id === id) ?? null;
}

async function loadRelicIds(): Promise<string[]> {
  const data = await readJsonFile<{ relics: { id: string }[] }>('relics.json');
  return data.relics.map((r) => r.id);
}

async function loadReferenceEnemy() {
  const data = await readJsonFile<{ enemies: import('@rcb/shared').EnemyDefinition[] }>(
    'enemies.json'
  );
  return data.enemies.find((e) => e.id === 'mirror_knight') ?? data.enemies[0];
}

export async function generateClassDraft(options: {
  theme: string;
  nameHint?: string;
  classIdPrefix?: string;
  cardCount?: number;
  userPrompt?: string;
}): Promise<GeneratedClassDraft> {
  const relicIds = await loadRelicIds();
  const referenceEnemy = await loadReferenceEnemy();

  const { raw, usedFallback, prompt } = await callLlmForClassPack({
    ...options,
    availableRelicIds: relicIds,
  });

  const normalized = normalizeGeneratedClassPack(raw);
  const { pack, report } = validateGeneratedClassPack(normalized, {
    knownRelicIds: relicIds,
    referenceEnemy,
    runSimulation: !usedFallback,
    simRuns: 12,
  });

  if (usedFallback && report.simulation === null) {
    report.warnings.push('模板模式：已跳过战斗模拟（配置 LLM_API_KEY 后生成内容将强制模拟）');
  }

  const draft: GeneratedClassDraft = {
    id: createEventId().replace('evt_', 'draft_'),
    createdAt: new Date().toISOString(),
    theme: options.theme,
    status: report.overallValid ? 'validated' : 'rejected',
    usedFallback,
    pack: pack ?? normalized,
    validation: report,
    prompt,
  };

  const registry = await loadDrafts();
  registry.drafts.unshift(draft);
  await saveDrafts(registry);

  return draft;
}

export async function revalidateDraft(id: string): Promise<GeneratedClassDraft | null> {
  const draft = await getDraft(id);
  if (!draft) return null;

  const relicIds = await loadRelicIds();
  const referenceEnemy = await loadReferenceEnemy();
  const normalized = normalizeGeneratedClassPack(draft.pack);
  const { pack, report } = validateGeneratedClassPack(normalized, {
    knownRelicIds: relicIds,
    referenceEnemy,
    runSimulation: true,
  });

  draft.validation = report;
  draft.status = report.overallValid ? 'validated' : 'rejected';
  if (pack) draft.pack = pack;

  const registry = await loadDrafts();
  const idx = registry.drafts.findIndex((d) => d.id === id);
  if (idx >= 0) registry.drafts[idx] = draft;
  await saveDrafts(registry);

  return draft;
}

export async function approveDraft(
  id: string,
  unlockClass = true
): Promise<{ classId: string; cardFile: string }> {
  const draft = await getDraft(id);
  if (!draft) throw new Error('Draft not found');
  if (draft.status !== 'validated') {
    throw new Error('Draft must pass validation before approval');
  }

  const pack = draft.pack as GeneratedClassPackInput;
  const classId = pack.class.id;

  const classesData = await readJsonFile<ClassesFile>('classes.json');
  if (classesData.classes.some((c) => c.id === classId)) {
    throw new Error(`Class id already exists: ${classId}`);
  }

  classesData.classes.push(pack.class);
  await writeJsonFile('classes.json', classesData);

  const cardFile = `cards/${classId}.json`;
  await writeJsonFile(cardFile, { cards: pack.cards });

  if (unlockClass) {
    const metaData = await readJsonFile<MetaFile>('meta.json');
    if (!metaData.meta.upgrades.unlockedClasses.includes(classId)) {
      metaData.meta.upgrades.unlockedClasses.push(classId);
      await writeJsonFile('meta.json', metaData);
    }
  }

  draft.status = 'approved';
  const registry = await loadDrafts();
  const idx = registry.drafts.findIndex((d) => d.id === id);
  if (idx >= 0) registry.drafts[idx] = draft;
  await saveDrafts(registry);

  invalidateImageRegistryCache();
  draftsCache = null;

  await listCardPoolFiles();

  return { classId, cardFile };
}

export async function deleteDraft(id: string): Promise<boolean> {
  const registry = await loadDrafts();
  const before = registry.drafts.length;
  registry.drafts = registry.drafts.filter((d) => d.id !== id);
  if (registry.drafts.length === before) return false;
  await saveDrafts(registry);
  return true;
}

export function invalidateDraftsCache(): void {
  draftsCache = null;
}
