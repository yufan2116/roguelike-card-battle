import { Router } from 'express';
import {
  BatchGenerateRequestSchema,
  GenerateImageRequestSchema,
  SetActiveVariantRequestSchema,
  SetGlobalPresetRequestSchema,
  type ImageEntityType,
} from '@rcb/shared';
import {
  generateAndRegisterImage,
  getImageRecord,
  getStylePresets,
  listAllImageRecords,
  loadImageRegistry,
  resolveActiveImagePath,
  resolveMonsterAssetForEntity,
  setActiveVariant,
  setGlobalPreset,
} from '../services/imageAssets.js';
import { listEntitiesByType, resolveEntityDefinition } from '../services/entityResolver.js';
import { config } from '../config.js';

export const imagesRouter = Router();

imagesRouter.get('/presets', (_req, res) => {
  res.json({ presets: getStylePresets() });
});

imagesRouter.get('/status', (_req, res) => {
  res.json({
    hasApiKey: Boolean(config.imageApiKey),
    model: config.imageModel,
    baseUrl: config.imageApiBaseUrl,
  });
});

imagesRouter.get('/registry', async (_req, res) => {
  try {
    const registry = await loadImageRegistry();
    res.json({ registry });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

imagesRouter.get('/entities/:entityType', async (req, res) => {
  try {
    const entityType = req.params.entityType as ImageEntityType;
    const entities = await listEntitiesByType(entityType);
    res.json({ entities });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

imagesRouter.get('/resolve/:entityType/:entityId', async (req, res) => {
  try {
    const entityType = req.params.entityType as ImageEntityType;
    const entityId = req.params.entityId;
    const [record, imagePath, entity] = await Promise.all([
      getImageRecord(entityType, entityId),
      resolveActiveImagePath(entityType, entityId),
      resolveEntityDefinition(entityType, entityId),
    ]);
    res.json({ record, imagePath, entity });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

imagesRouter.get('/monster/:entityType/:entityId', async (req, res) => {
  try {
    const entityType = req.params.entityType as ImageEntityType;
    if (entityType !== 'enemy' && entityType !== 'boss') {
      res.status(400).json({ error: 'Only enemy/boss support monster layers' });
      return;
    }
    const entityId = req.params.entityId;
    const legacy = await resolveActiveImagePath(entityType, entityId);
    const monsterAsset = await resolveMonsterAssetForEntity(entityType, entityId, legacy);
    res.json({ monsterAsset });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

imagesRouter.post('/generate', async (req, res) => {
  try {
    const body = GenerateImageRequestSchema.parse(req.body);
    const result = await generateAndRegisterImage(body);
    res.json({
      ok: true,
      ...result,
      message: result.usedFallback
        ? '未配置 API Key 或 API 失败，已生成本地 SVG 占位图'
        : '图片生成成功',
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

imagesRouter.post('/generate-batch', async (req, res) => {
  try {
    const body = BatchGenerateRequestSchema.parse(req.body);
    const entities = await listEntitiesByType(body.entityType);
    const limit = body.limit ?? 5;
    const targets = entities.slice(0, limit);
    const results = [];

    for (const entity of targets) {
      const result = await generateAndRegisterImage({
        entityType: body.entityType,
        entityId: entity.id,
        preset: body.preset,
        customPrompt: body.customPrompt,
      });
      results.push({
        entityId: entity.id,
        entityName: entity.name,
        imagePath: result.imagePath,
        usedFallback: result.usedFallback,
      });
    }

    res.json({ ok: true, results });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

imagesRouter.post('/active-variant', async (req, res) => {
  try {
    const body = SetActiveVariantRequestSchema.parse(req.body);
    const record = await setActiveVariant(body.entityType, body.entityId, body.variantId);
    res.json({ ok: true, record });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

imagesRouter.post('/global-preset', async (req, res) => {
  try {
    const body = SetGlobalPresetRequestSchema.parse(req.body);
    const registry = await setGlobalPreset(body.preset);
    res.json({ ok: true, registry });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

imagesRouter.get('/records', async (_req, res) => {
  try {
    const records = await listAllImageRecords();
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
