import {
  CardSchema,
  ClassSchema,
  EnemySchema,
  RelicSchema,
  type CardDefinition,
  type ClassDefinition,
  type EnemyDefinition,
  type ImageEntityType,
  type RelicDefinition,
} from '@rcb/shared';
import { readJsonFile } from './storage.js';
import { listCardPoolFiles } from './cardFileRegistry.js';

interface ClassesFile {
  classes: ClassDefinition[];
}
interface CardsFile {
  cards: CardDefinition[];
}
interface EnemiesFile {
  enemies: EnemyDefinition[];
}
interface RelicsFile {
  relics: RelicDefinition[];
}

async function loadClasses(): Promise<ClassDefinition[]> {
  const data = await readJsonFile<ClassesFile>('classes.json');
  return data.classes.map((c) => ClassSchema.parse(c) as ClassDefinition);
}

async function loadCards(): Promise<CardDefinition[]> {
  const all: CardDefinition[] = [];
  const files = await listCardPoolFiles();
  for (const file of files) {
    const data = await readJsonFile<CardsFile>(file);
    all.push(...data.cards.map((c) => CardSchema.parse(c) as CardDefinition));
  }
  return all;
}

async function loadEnemies(): Promise<EnemyDefinition[]> {
  const data = await readJsonFile<EnemiesFile>('enemies.json');
  return data.enemies.map((e) => EnemySchema.parse(e) as EnemyDefinition);
}

async function loadRelics(): Promise<RelicDefinition[]> {
  const data = await readJsonFile<RelicsFile>('relics.json');
  return data.relics.map((r) => RelicSchema.parse(r) as RelicDefinition);
}

export interface EntityDefinitionLite {
  id: string;
  name: string;
  imagePrompt: string;
  styleTags?: string[];
  subLabel?: string;
}

export async function resolveEntityDefinition(
  entityType: ImageEntityType,
  entityId: string
): Promise<EntityDefinitionLite | null> {
  switch (entityType) {
    case 'class': {
      const classes = await loadClasses();
      const cls = classes.find((c) => c.id === entityId);
      return cls
        ? { id: cls.id, name: cls.name, imagePrompt: cls.imagePrompt, styleTags: cls.styleTags }
        : null;
    }
    case 'card': {
      const cards = await loadCards();
      const card = cards.find((c) => c.id === entityId);
      return card
        ? {
            id: card.id,
            name: card.name,
            imagePrompt: card.imagePrompt,
            styleTags: card.styleTags,
            subLabel: card.classId,
          }
        : null;
    }
    case 'relic': {
      const relics = await loadRelics();
      const relic = relics.find((r) => r.id === entityId);
      return relic
        ? {
            id: relic.id,
            name: relic.name,
            imagePrompt: relic.imagePrompt,
            styleTags: relic.styleTags,
          }
        : null;
    }
    case 'enemy':
    case 'boss': {
      const enemies = await loadEnemies();
      const enemy = enemies.find((e) => e.id === entityId);
      if (!enemy) return null;
      if (entityType === 'boss' && !enemy.isBoss) return null;
      return {
        id: enemy.id,
        name: enemy.name,
        imagePrompt: enemy.imagePrompt,
        subLabel: enemy.isBoss ? 'Boss' : enemy.isElite ? 'Elite' : 'Normal',
      };
    }
    default:
      return null;
  }
}

export async function listEntitiesByType(
  entityType: ImageEntityType
): Promise<EntityDefinitionLite[]> {
  switch (entityType) {
    case 'class':
      return (await loadClasses()).map((c) => ({
        id: c.id,
        name: c.name,
        imagePrompt: c.imagePrompt,
        styleTags: c.styleTags,
      }));
    case 'card':
      return (await loadCards()).map((c) => ({
        id: c.id,
        name: c.name,
        imagePrompt: c.imagePrompt,
        styleTags: c.styleTags,
        subLabel: c.classId,
      }));
    case 'relic':
      return (await loadRelics()).map((r) => ({
        id: r.id,
        name: r.name,
        imagePrompt: r.imagePrompt,
        styleTags: r.styleTags,
      }));
    case 'enemy':
      return (await loadEnemies())
        .filter((e) => !e.isBoss)
        .map((e) => ({
          id: e.id,
          name: e.name,
          imagePrompt: e.imagePrompt,
          subLabel: e.isElite ? 'Elite' : 'Normal',
        }));
    case 'boss':
      return (await loadEnemies())
        .filter((e) => e.isBoss)
        .map((e) => ({
          id: e.id,
          name: e.name,
          imagePrompt: e.imagePrompt,
          subLabel: 'Boss',
        }));
    default:
      return [];
  }
}
