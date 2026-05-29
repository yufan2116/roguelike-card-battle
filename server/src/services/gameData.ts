import {

  CardSchema,

  ClassSchema,

  EnemySchema,

  RelicSchema,

  createDefaultMetaBonuses,

  createNewRun,

  endPlayerTurn,

  finalizeRunWithMeta,

  initCombatForNode,

  initEncounter,

  playCard,

  prepareRewards,

  selectMapNode,

  selectReward,

  skipReward,

  buyShopItem,

  leaveEncounter,

  restHeal,

  restUpgradeCard,
  restUpgradeMaxHp,

  claimTreasure,

  resolveEventChoice,

  type CardDefinition,

  type ClassDefinition,

  type EnemyDefinition,

  type MetaProgress,

  type RelicDefinition,

  type RunState,

} from '@rcb/shared';

import type { GameEventDefinition } from '@rcb/shared';

import { readJsonFile, writeJsonFile } from './storage.js';
import { resolveActiveImagePath } from './imageAssets.js';
import type { ImageEntityType } from '@rcb/shared';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import {
  isRunContinuable,
  purchaseMetaUpgrade,
  type SaveSlotSummary,
} from '@rcb/shared';



interface ClassesFile {

  classes: ClassDefinition[];

}



interface CardsFile {

  cards: CardDefinition[];

}

import { listCardPoolFiles } from './cardFileRegistry.js';



interface EnemiesFile {

  enemies: EnemyDefinition[];

}



interface RelicsFile {

  relics: RelicDefinition[];

}



interface EventsFile {

  events: GameEventDefinition[];

}



interface MetaFile {

  meta: MetaProgress;

}



export async function getClasses(): Promise<ClassDefinition[]> {

  const data = await readJsonFile<ClassesFile>('classes.json');

  const classes = data.classes.map((c) => ClassSchema.parse(c));

  return enrichWithImages('class', classes);

}



export async function getClassById(id: string): Promise<ClassDefinition | null> {

  const classes = await getClasses();

  return classes.find((c) => c.id === id) ?? null;

}



export async function getCards(): Promise<CardDefinition[]> {

  const all: CardDefinition[] = [];
  const files = await listCardPoolFiles();

  for (const file of files) {

    const data = await readJsonFile<CardsFile>(file);

    all.push(...data.cards.map((c) => CardSchema.parse(c) as CardDefinition));

  }

  return enrichWithImages('card', all);

}



export async function getCardsByClass(classId: string): Promise<CardDefinition[]> {

  const cards = await getCards();

  return cards.filter((c) => c.classId === classId);

}



export async function getEnemies(): Promise<EnemyDefinition[]> {

  const data = await readJsonFile<EnemiesFile>('enemies.json');

  const enemies = data.enemies.map((e) => EnemySchema.parse(e) as EnemyDefinition);

  return Promise.all(
    enemies.map(async (enemy) => {
      const entityType: ImageEntityType = enemy.isBoss ? 'boss' : 'enemy';
      const resolved = await resolveActiveImagePath(entityType, enemy.id);
      return resolved ? { ...enemy, imagePath: resolved } : enemy;
    })
  );

}



export async function getEnemyById(id: string): Promise<EnemyDefinition | null> {

  const enemies = await getEnemies();

  return enemies.find((e) => e.id === id) ?? null;

}



export async function getRelics(): Promise<RelicDefinition[]> {

  const data = await readJsonFile<RelicsFile>('relics.json');

  const relics = data.relics.map((r) => RelicSchema.parse(r) as RelicDefinition);

  return enrichWithImages('relic', relics);

}



export async function getEvents(): Promise<GameEventDefinition[]> {

  const data = await readJsonFile<EventsFile>('events.json');

  return data.events;

}



export async function getMetaProgress(): Promise<MetaProgress> {

  const data = await readJsonFile<MetaFile>('meta.json');

  return data.meta;

}



export async function saveMetaProgress(meta: MetaProgress): Promise<void> {

  await writeJsonFile('meta.json', { meta });

}



function migrateRun(run: RunState): RunState {

  if (run.combat === undefined) run.combat = null;

  if (run.encounter === undefined) run.encounter = null;

  if (run.runResult === undefined) run.runResult = null;

  if (!run.player.upgradedCards) run.player.upgradedCards = [];

  return run;

}



async function applyDefeatMeta(run: RunState): Promise<RunState> {

  if (run.runResult) return run;

  const meta = await getMetaProgress();

  const { run: finalized, meta: updatedMeta } = finalizeRunWithMeta(run, meta, false);

  await saveMetaProgress(updatedMeta);

  return finalized;

}



async function applyVictoryMeta(run: RunState): Promise<RunState> {

  if (run.runResult) return run;

  const meta = await getMetaProgress();

  const { run: finalized, meta: updatedMeta } = finalizeRunWithMeta(run, meta, true);

  await saveMetaProgress(updatedMeta);

  return finalized;

}



export async function startRun(
  classId: string,
  seed?: string,
  startingRelicId?: string
): Promise<RunState> {

  const classDef = await getClassById(classId);

  if (!classDef) {

    throw new Error(`Class not found: ${classId}`);

  }



  const meta = await getMetaProgress();

  const bonuses = {

    bonusMaxHp: meta.upgrades.bonusMaxHp,

    bonusStartingGold: meta.upgrades.bonusStartingGold,

    unlockedClasses: meta.upgrades.unlockedClasses,

    extraCardChoices: meta.upgrades.extraCardChoices,

    unlockedRelicPool: meta.upgrades.unlockedRelicPool,

  };



  if (!bonuses.unlockedClasses.includes(classId)) {

    throw new Error(`Class locked: ${classId}`);

  }



  const run = createNewRun(classDef, bonuses, seed, startingRelicId);

  await writeJsonFile(`saves/${run.id}.json`, run);

  return run;

}



export async function getRun(runId: string): Promise<RunState | null> {

  try {

    const run = migrateRun(await readJsonFile<RunState>(`saves/${runId}.json`));

    return run;

  } catch {

    return null;

  }

}



export async function saveRun(run: RunState): Promise<void> {

  await writeJsonFile(`saves/${run.id}.json`, {

    ...run,

    updatedAt: new Date().toISOString(),

  });

}



export async function handleSelectNode(runId: string, nodeId: string): Promise<RunState> {

  let run = await getRun(runId);

  if (!run) throw new Error('Run not found');



  run = selectMapNode(run, nodeId);



  const node = run.map.nodes.find((n) => n.id === nodeId);

  const isCombat =

    node?.type === 'normal_combat' ||

    node?.type === 'elite_combat' ||

    node?.type === 'boss';



  if (isCombat) {

    const enemies = await getEnemies();

    run = initCombatForNode(run, enemies);

  } else if (node) {

    const [cards, relics, events] = await Promise.all([

      getCards(),

      getRelics(),

      getEvents(),

    ]);

    run = initEncounter(run, node.type, node.contentId ?? node.id, cards, relics, events);

  }



  await saveRun(run);

  return run;

}



export async function handlePlayCard(

  runId: string,

  handIndex: number

): Promise<RunState> {

  let run = await getRun(runId);

  if (!run?.combat) throw new Error('Not in combat');



  const cards = await getCards();

  const cardId = run.combat.player.hand[handIndex];

  const cardDef = cards.find((c) => c.id === cardId);

  if (!cardDef) throw new Error('Card not found in hand');



  const enemyDef = await getEnemyById(run.combat.enemyDefinitionId);

  run = playCard(run, handIndex, cardDef, enemyDef ?? undefined);



  if (run.phase === 'reward') {

    run = prepareRewards(run, cards);

  } else if (run.phase === 'victory') {

    run = await applyVictoryMeta(run);

  } else if (run.phase === 'defeat') {

    run = await applyDefeatMeta(run);

  }



  await saveRun(run);

  return run;

}



export async function handleEndTurn(runId: string): Promise<RunState> {

  let run = await getRun(runId);

  if (!run?.combat) throw new Error('Not in combat');



  const enemyDef = await getEnemyById(run.combat.enemyDefinitionId);

  if (!enemyDef) throw new Error('Enemy not found');



  run = endPlayerTurn(run, enemyDef);



  if (run.phase === 'reward') {

    const cards = await getCards();

    run = prepareRewards(run, cards);

  } else if (run.phase === 'victory') {

    run = await applyVictoryMeta(run);

  } else if (run.phase === 'defeat') {

    run = await applyDefeatMeta(run);

  }



  await saveRun(run);

  return run;

}



export async function handleSelectReward(

  runId: string,

  cardId: string

): Promise<RunState> {

  let run = await getRun(runId);

  if (!run) throw new Error('Run not found');



  run = selectReward(run, cardId);

  await saveRun(run);

  return run;

}



export async function handleSkipReward(runId: string): Promise<RunState> {

  let run = await getRun(runId);

  if (!run) throw new Error('Run not found');



  run = skipReward(run);

  await saveRun(run);

  return run;

}



export async function handleBuyShopItem(

  runId: string,

  itemKey: string

): Promise<RunState> {

  let run = await getRun(runId);

  if (!run) throw new Error('Run not found');

  run = buyShopItem(run, itemKey);

  await saveRun(run);

  return run;

}



export async function handleLeaveEncounter(runId: string): Promise<RunState> {

  let run = await getRun(runId);

  if (!run) throw new Error('Run not found');

  run = leaveEncounter(run);

  await saveRun(run);

  return run;

}



export async function handleRestHeal(runId: string): Promise<RunState> {

  let run = await getRun(runId);

  if (!run) throw new Error('Run not found');

  run = restHeal(run);

  await saveRun(run);

  return run;

}



export async function handleRestUpgradeCard(
  runId: string,
  cardId: string
): Promise<RunState> {
  let run = await getRun(runId);
  if (!run) throw new Error('Run not found');
  run = restUpgradeCard(run, cardId);
  await saveRun(run);
  return run;
}

export async function handleRestUpgrade(runId: string): Promise<RunState> {

  let run = await getRun(runId);

  if (!run) throw new Error('Run not found');

  run = restUpgradeMaxHp(run);

  await saveRun(run);

  return run;

}



export async function handleClaimTreasure(runId: string): Promise<RunState> {

  let run = await getRun(runId);

  if (!run) throw new Error('Run not found');

  run = claimTreasure(run);

  run = leaveEncounter(run);

  await saveRun(run);

  return run;

}



export async function handleEventChoice(

  runId: string,

  choiceId: string

): Promise<RunState> {

  let run = await getRun(runId);

  if (!run) throw new Error('Run not found');

  const [cards, relics] = await Promise.all([getCards(), getRelics()]);

  run = resolveEventChoice(run, choiceId, cards, relics);

  if (run.phase === 'defeat') {

    run = await applyDefeatMeta(run);

  }

  await saveRun(run);

  return run;

}



export { createDefaultMetaBonuses };

export async function listSaveSlots(): Promise<SaveSlotSummary[]> {
  const savesDir = path.join(config.dataDir, 'saves');
  let files: string[] = [];
  try {
    files = (await fs.readdir(savesDir)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }

  const classes = await getClasses();
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  const slots: SaveSlotSummary[] = [];
  for (const file of files) {
    try {
      const run = migrateRun(await readJsonFile<RunState>(`saves/${file}`));
      slots.push({
        runId: run.id,
        seed: run.seed,
        classId: run.player.classId,
        className: classMap.get(run.player.classId),
        phase: run.phase,
        floor: run.floor,
        currentHp: run.player.currentHp,
        maxHp: run.player.maxHp,
        gold: run.player.gold,
        relicCount: run.player.relics.length,
        deckSize: run.player.deck.length,
        updatedAt: run.updatedAt,
        createdAt: run.createdAt,
        continuable: isRunContinuable(run.phase),
      });
    } catch {
      /* skip corrupt save */
    }
  }

  return slots.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function abandonRun(runId: string): Promise<RunState> {
  let run = await getRun(runId);
  if (!run) throw new Error('Run not found');
  if (!isRunContinuable(run.phase)) throw new Error('Run already finished');

  run = await applyDefeatMeta(run);
  await saveRun(run);
  return run;
}

export async function deleteSave(runId: string): Promise<boolean> {
  const filePath = path.join(config.dataDir, 'saves', `${runId}.json`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function handlePurchaseMetaUpgrade(upgradeId: import('@rcb/shared').MetaUpgradeId) {
  const meta = await getMetaProgress();
  const { meta: updated, message } = purchaseMetaUpgrade(meta, upgradeId);
  await saveMetaProgress(updated);
  return { meta: updated, message };
}

async function enrichWithImages<T extends { id: string; imagePath?: string }>(
  entityType: ImageEntityType,
  items: T[]
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const resolved = await resolveActiveImagePath(entityType, item.id);
      return resolved ? { ...item, imagePath: resolved } : item;
    })
  );
}


