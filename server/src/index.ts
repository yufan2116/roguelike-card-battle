import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { config } from './config.js';
import { ensureDirs } from './services/storage.js';
import { gameRouter } from './routes/game.js';
import { imagesRouter } from './routes/images.js';
import { llmRouter } from './routes/llm.js';
import { balanceRouter } from './routes/balance.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/assets', express.static(config.assetsDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.use('/api/game', gameRouter);
app.use('/api/images', imagesRouter);
app.use('/api/llm', llmRouter);
app.use('/api/balance', balanceRouter);

async function main() {
  await ensureDirs();
  app.listen(config.port, () => {
    console.log(`[RCB Server] http://localhost:${config.port}`);
    console.log(`[RCB Server] Data: ${config.dataDir}`);
    console.log(`[RCB Server] Assets: ${config.assetsDir}`);
  });
}

main().catch(console.error);
