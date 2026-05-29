import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

export async function readJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(config.dataDir, filename);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(config.dataDir, filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function ensureDirs(): Promise<void> {
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.mkdir(config.assetsDir, { recursive: true });
  await fs.mkdir(path.join(config.dataDir, 'saves'), { recursive: true });
  await fs.mkdir(path.join(config.dataDir, 'generated'), { recursive: true });
  await fs.mkdir(path.join(config.dataDir, 'balance'), { recursive: true });
}
