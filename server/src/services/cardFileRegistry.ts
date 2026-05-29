import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

const BUILTIN_CARD_FILES = [
  'cards/blood_blade_hunter.json',
  'cards/rune_mage.json',
  'cards/oath_knight.json',
];

export async function listCardPoolFiles(): Promise<string[]> {
  const cardsDir = path.join(config.dataDir, 'cards');
  try {
    const files = await fs.readdir(cardsDir);
    const dynamic = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => `cards/${f}`);
    const merged = new Set([...BUILTIN_CARD_FILES, ...dynamic]);
    return [...merged];
  } catch {
    return [...BUILTIN_CARD_FILES];
  }
}
