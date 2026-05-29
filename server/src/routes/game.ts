import { Router } from 'express';
import { PurchaseMetaUpgradeSchema } from '@rcb/shared';
import {
  getCards,
  getCardsByClass,
  getClasses,
  getEnemies,
  getEvents,
  getMetaProgress,
  getRelics,
  getRun,
  handleBuyShopItem,
  handleClaimTreasure,
  handleEndTurn,
  handleEventChoice,
  handleLeaveEncounter,
  handlePlayCard,
  handleRestHeal,
  handleRestUpgrade,
  handleRestUpgradeCard,
  handleSelectNode,
  handleSelectReward,
  handleSkipReward,
  startRun,
  listSaveSlots,
  abandonRun,
  deleteSave,
  handlePurchaseMetaUpgrade,
} from '../services/gameData.js';

export const gameRouter = Router();

gameRouter.get('/classes', async (_req, res) => {
  try {
    const classes = await getClasses();
    res.json({ classes });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.get('/cards', async (_req, res) => {
  try {
    const cards = await getCards();
    res.json({ cards });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.get('/cards/:classId', async (req, res) => {
  try {
    const cards = await getCardsByClass(req.params.classId);
    res.json({ cards });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.get('/enemies', async (_req, res) => {
  try {
    const enemies = await getEnemies();
    res.json({ enemies });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.get('/relics', async (_req, res) => {
  try {
    const relics = await getRelics();
    res.json({ relics });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.get('/events', async (_req, res) => {
  try {
    const events = await getEvents();
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.get('/meta', async (_req, res) => {
  try {
    const meta = await getMetaProgress();
    res.json({ meta });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.post('/runs', async (req, res) => {
  try {
    const { classId, seed, startingRelicId } = req.body as {
      classId?: string;
      seed?: string;
      startingRelicId?: string;
    };
    if (!classId) {
      res.status(400).json({ error: 'classId is required' });
      return;
    }
    const run = await startRun(classId, seed, startingRelicId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.get('/runs/:runId', async (req, res) => {
  try {
    const run = await getRun(req.params.runId);
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    res.json({ run });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/select-node', async (req, res) => {
  try {
    const { nodeId } = req.body as { nodeId?: string };
    if (!nodeId) {
      res.status(400).json({ error: 'nodeId is required' });
      return;
    }
    const updated = await handleSelectNode(req.params.runId, nodeId);
    res.json({ run: updated });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/combat/play-card', async (req, res) => {
  try {
    const { handIndex } = req.body as { handIndex?: number };
    if (handIndex === undefined || handIndex < 0) {
      res.status(400).json({ error: 'handIndex is required' });
      return;
    }
    const run = await handlePlayCard(req.params.runId, handIndex);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/combat/end-turn', async (req, res) => {
  try {
    const run = await handleEndTurn(req.params.runId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/reward/select', async (req, res) => {
  try {
    const { cardId } = req.body as { cardId?: string };
    if (!cardId) {
      res.status(400).json({ error: 'cardId is required' });
      return;
    }
    const run = await handleSelectReward(req.params.runId, cardId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/reward/skip', async (req, res) => {
  try {
    const run = await handleSkipReward(req.params.runId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/encounter/leave', async (req, res) => {
  try {
    const run = await handleLeaveEncounter(req.params.runId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/shop/buy', async (req, res) => {
  try {
    const { itemKey } = req.body as { itemKey?: string };
    if (!itemKey) {
      res.status(400).json({ error: 'itemKey is required' });
      return;
    }
    const run = await handleBuyShopItem(req.params.runId, itemKey);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/rest/heal', async (req, res) => {
  try {
    const run = await handleRestHeal(req.params.runId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/rest/upgrade-card', async (req, res) => {
  try {
    const { cardId } = req.body as { cardId?: string };
    if (!cardId) {
      res.status(400).json({ error: 'cardId is required' });
      return;
    }
    const run = await handleRestUpgradeCard(req.params.runId, cardId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/rest/upgrade', async (req, res) => {
  try {
    const run = await handleRestUpgrade(req.params.runId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/treasure/claim', async (req, res) => {
  try {
    const run = await handleClaimTreasure(req.params.runId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.get('/saves', async (_req, res) => {
  try {
    const saves = await listSaveSlots();
    res.json({ saves });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.post('/meta/purchase', async (req, res) => {
  try {
    const body = PurchaseMetaUpgradeSchema.parse(req.body);
    const result = await handlePurchaseMetaUpgrade(body.upgradeId);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/abandon', async (req, res) => {
  try {
    const run = await abandonRun(req.params.runId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.delete('/runs/:runId', async (req, res) => {
  try {
    const ok = await deleteSave(req.params.runId);
    if (!ok) {
      res.status(404).json({ error: 'Save not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

gameRouter.post('/runs/:runId/event/choose', async (req, res) => {
  try {
    const { choiceId } = req.body as { choiceId?: string };
    if (!choiceId) {
      res.status(400).json({ error: 'choiceId is required' });
      return;
    }
    const run = await handleEventChoice(req.params.runId, choiceId);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});
