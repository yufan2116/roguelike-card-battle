import { Router } from 'express';
import {
  ApproveDraftRequestSchema,
  GenerateClassPackRequestSchema,
} from '@rcb/shared';
import {
  approveDraft,
  deleteDraft,
  generateClassDraft,
  getDraft,
  listDrafts,
  revalidateDraft,
} from '../services/contentGenerator.js';
import { config } from '../config.js';

export const llmRouter = Router();

llmRouter.get('/status', (_req, res) => {
  res.json({
    hasApiKey: Boolean(config.llmApiKey),
    model: config.llmModel,
    baseUrl: config.llmApiBaseUrl,
    imageApiSeparate: true,
    note: 'LLM_API_KEY 与 IMAGE_API_KEY 独立配置',
  });
});

llmRouter.get('/drafts', async (_req, res) => {
  try {
    const drafts = await listDrafts();
    res.json({ drafts });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

llmRouter.get('/drafts/:id', async (req, res) => {
  try {
    const draft = await getDraft(req.params.id);
    if (!draft) {
      res.status(404).json({ error: 'Draft not found' });
      return;
    }
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

llmRouter.post('/generate-class', async (req, res) => {
  try {
    const body = GenerateClassPackRequestSchema.parse(req.body);
    const draft = await generateClassDraft(body);
    res.json({
      ok: true,
      draft,
      message: draft.usedFallback
        ? '未配置 LLM_API_KEY，已使用规则模板生成（仍经 Schema + 预算 + 战斗模拟校验）'
        : draft.validation.overallValid
          ? 'LLM 生成并通过校验'
          : 'LLM 生成完成，但未通过全部校验',
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

llmRouter.post('/drafts/:id/revalidate', async (req, res) => {
  try {
    const draft = await revalidateDraft(req.params.id);
    if (!draft) {
      res.status(404).json({ error: 'Draft not found' });
      return;
    }
    res.json({ ok: true, draft });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

llmRouter.post('/drafts/:id/approve', async (req, res) => {
  try {
    const body = ApproveDraftRequestSchema.parse(req.body ?? {});
    const result = await approveDraft(req.params.id, body.unlockClass ?? true);
    res.json({
      ok: true,
      ...result,
      message: `职业 ${result.classId} 已写入游戏数据`,
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

llmRouter.delete('/drafts/:id', async (req, res) => {
  try {
    const ok = await deleteDraft(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Draft not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});
