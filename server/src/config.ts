import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(rootDir, '.env') });

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  dataDir: path.resolve(rootDir, process.env.DATA_DIR ?? './data'),
  assetsDir: path.resolve(rootDir, process.env.ASSETS_DIR ?? './assets'),
  imageApiKey: process.env.IMAGE_API_KEY ?? '',
  imageApiBaseUrl:
    process.env.IMAGE_API_BASE_URL ??
    (process.env.IMAGE_BASE_URL
      ? `${process.env.IMAGE_BASE_URL.replace(/\/$/, '')}/images/generations`
      : 'https://api.openai.com/v1/images/generations'),
  imageModel: process.env.IMAGE_MODEL ?? 'dall-e-3',
  llmApiKey: process.env.LLM_API_KEY ?? '',
  llmApiBaseUrl: process.env.LLM_API_BASE_URL ?? 'https://api.openai.com/v1/chat/completions',
  llmModel: process.env.LLM_MODEL ?? 'gpt-4o-mini',
};
