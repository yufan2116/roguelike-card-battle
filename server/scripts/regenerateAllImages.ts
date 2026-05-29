import fs from 'node:fs/promises';
import path from 'node:path';
import type { ArtStylePreset, ImageAssetRole, ImageEntityType } from '@rcb/shared';
import { config } from '../src/config.js';
import {
  generateAndRegisterImage,
  invalidateImageRegistryCache,
  loadImageRegistry,
  saveImageRegistry,
} from '../src/services/imageAssets.js';
import { listEntitiesByType } from '../src/services/entityResolver.js';

const PRESET: ArtStylePreset = 'dark_fairy_tale';
const DELAY_MS = 1200;
const TASK_RETRIES = 3;
const resumeMode = process.argv.includes('--resume');

interface GenTask {
  entityType: ImageEntityType;
  entityId: string;
  assetRole?: ImageAssetRole;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buildTasks(): Promise<GenTask[]> {
  const tasks: GenTask[] = [];
  const order: ImageEntityType[] = ['class', 'enemy', 'boss', 'relic', 'card'];

  for (const entityType of order) {
    const entities = await listEntitiesByType(entityType);
    for (const entity of entities) {
      if (entityType === 'enemy' || entityType === 'boss') {
        tasks.push({ entityType, entityId: entity.id, assetRole: 'portrait' });
        tasks.push({ entityType, entityId: entity.id, assetRole: 'background' });
      } else {
        tasks.push({ entityType, entityId: entity.id });
      }
    }
  }

  return tasks;
}

async function filterCompletedTasks(tasks: GenTask[]): Promise<GenTask[]> {
  const registry = await loadImageRegistry();
  return tasks.filter((task) => {
    const record = registry.records.find(
      (r) => r.entityType === task.entityType && r.entityId === task.entityId
    );
    if (!record) return true;

    if (task.assetRole === 'portrait') {
      return !record.monsterLayer?.portraitVariantId;
    }
    if (task.assetRole === 'background') {
      return !record.monsterLayer?.backgroundVariantId;
    }

    return record.variants.length === 0 || !record.activeVariantId;
  });
}

async function wipeOldAssets(): Promise<void> {
  const generatedDir = path.join(config.assetsDir, 'generated');
  await fs.rm(generatedDir, { recursive: true, force: true });
  await fs.mkdir(generatedDir, { recursive: true });

  const registryPath = path.join(config.dataDir, 'imageAssets.json');
  await fs.writeFile(
    registryPath,
    JSON.stringify({ globalPreset: PRESET, records: [] }, null, 2),
    'utf-8'
  );
  invalidateImageRegistryCache();
  console.log('已删除 assets/generated 并重置 imageAssets.json');
}

async function main(): Promise<void> {
  if (!config.imageApiKey) {
    console.error('未配置 IMAGE_API_KEY，无法生成 PNG');
    process.exit(1);
  }

  if (resumeMode) {
    invalidateImageRegistryCache();
    console.log('续跑模式：跳过已有资源');
  } else {
    await wipeOldAssets();
  }

  const allTasks = await buildTasks();
  const tasks = resumeMode ? await filterCompletedTasks(allTasks) : allTasks;

  if (tasks.length === 0) {
    console.log('没有待生成的资源');
    return;
  }

  console.log(`开始生成 ${tasks.length} 张轻量游戏资产...\n`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]!;
    const label = `${task.entityType}/${task.entityId}${task.assetRole ? ` (${task.assetRole})` : ''}`;
    process.stdout.write(`[${i + 1}/${tasks.length}] ${label} ... `);

    try {
      let result = null;
      for (let attempt = 1; attempt <= TASK_RETRIES; attempt++) {
        try {
          result = await generateAndRegisterImage({
            entityType: task.entityType,
            entityId: task.entityId,
            preset: PRESET,
            assetRole: task.assetRole,
            strict: true,
          });
          break;
        } catch (err) {
          if (attempt >= TASK_RETRIES) throw err;
          console.log(`\n  重试 ${attempt}/${TASK_RETRIES - 1} ...`);
          await sleep(3000 * attempt);
        }
      }
      if (!result) throw new Error('生成失败');
      ok++;
      console.log(result.imagePath);
    } catch (err) {
      failed++;
      console.log(`失败: ${String(err)}`);
    }

    if (i < tasks.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n完成: ${ok} PNG, ${failed} 失败`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
