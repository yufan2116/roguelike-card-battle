import { Router } from 'express';
import {
  RunClassAuditRequestSchema,
  RunGlobalAuditRequestSchema,
  RunSimRequestSchema,
} from '@rcb/shared';
import {
  auditAll,
  auditClass,
  getBalanceScenarios,
  getLastBalanceReport,
  runSingleSimulation,
} from '../services/balanceService.js';

export const balanceRouter = Router();

balanceRouter.get('/scenarios', (_req, res) => {
  res.json({ scenarios: getBalanceScenarios() });
});

balanceRouter.get('/report', async (_req, res) => {
  try {
    const report = await getLastBalanceReport();
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

balanceRouter.post('/simulate', async (req, res) => {
  try {
    const body = RunSimRequestSchema.parse(req.body);
    const report = await runSingleSimulation(body);
    res.json({ ok: true, report });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

balanceRouter.post('/audit/class', async (req, res) => {
  try {
    const body = RunClassAuditRequestSchema.parse(req.body);
    const report = await auditClass(body.classId, body.runsPerCell ?? 16);
    res.json({ ok: true, report });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

balanceRouter.post('/audit/all', async (req, res) => {
  try {
    const body = RunGlobalAuditRequestSchema.parse(req.body ?? {});
    const report = await auditAll({ runsPerCell: body.runsPerCell ?? 12 });
    res.json({ ok: true, report });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});
