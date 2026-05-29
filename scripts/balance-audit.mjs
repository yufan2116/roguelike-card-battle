#!/usr/bin/env node
/**
 * CLI：运行全局平衡审计
 * npm run balance
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(dataDir, rel), 'utf8'));
}

const { runGlobalBalanceReport } = await import('../packages/shared/dist/simulation/balanceEngine.js');

const classes = readJson('classes.json').classes;
const enemies = readJson('enemies.json').enemies;
const cards = [];
for (const file of ['blood_blade_hunter', 'rune_mage', 'oath_knight']) {
  try {
    cards.push(...readJson(`cards/${file}.json`).cards);
  } catch {
    /* dynamic classes */
  }
}

const cardDir = path.join(dataDir, 'cards');
try {
  const { readdirSync } = await import('node:fs');
  for (const f of readdirSync(cardDir)) {
    if (f.endsWith('.json') && !['blood_blade_hunter', 'rune_mage', 'oath_knight'].some((p) => f.startsWith(p))) {
      cards.push(...readJson(`cards/${f}`).cards);
    }
  }
} catch {
  /* ignore */
}

const runs = parseInt(process.argv[2] ?? '8', 10);
console.log(`Running balance audit (${runs} runs/cell)…`);
const report = runGlobalBalanceReport(classes, cards, enemies, { runsPerCell: runs });

mkdirSync(path.join(dataDir, 'balance'), { recursive: true });
writeFileSync(path.join(dataDir, 'balance/lastReport.json'), JSON.stringify(report, null, 2));

console.log(`Overall score: ${report.overallScore} | Passed: ${report.passed}`);
for (const cls of report.classes) {
  console.log(`  ${cls.className}: ${cls.overallScore} (${cls.passed ? 'OK' : 'NEEDS WORK'})`);
}
if (report.suggestions.length) {
  console.log('\nSuggestions:');
  report.suggestions.forEach((s) => console.log(`  - ${s}`));
}
