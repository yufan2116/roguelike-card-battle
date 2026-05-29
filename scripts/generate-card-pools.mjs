/**
 * 一次性脚本：生成三职业卡池 JSON（各 25 张）
 * 运行: node scripts/generate-card-pools.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../data/cards');

function card(id, name, classId, type, cost, rarity, description, effects, powerBudget, upgradedEffects) {
  return {
    id,
    name,
    classId,
    type,
    cost,
    rarity,
    description,
    effects,
    ...(upgradedEffects ? { upgradedEffects } : {}),
    powerBudget,
    imagePrompt: `${name} card art, ${classId}, dungeon roguelike`,
  };
}

const bloodBlade = [
  card('bb_strike', '血刃斩', 'blood_blade_hunter', 'attack', 1, 'starter', '造成 6 点伤害。', [{ mechanism: 'damage', value: 6, target: 'enemy' }], 6, [{ mechanism: 'damage', value: 9, target: 'enemy' }]),
  card('bb_guard', '猎手格挡', 'blood_blade_hunter', 'defense', 1, 'starter', '获得 5 点格挡。', [{ mechanism: 'block', value: 5, target: 'self' }], 4, [{ mechanism: 'block', value: 8, target: 'self' }]),
  card('bb_bleed_slash', '裂血斩', 'blood_blade_hunter', 'attack', 1, 'starter', '造成 4 点伤害，施加 2 层流血。', [{ mechanism: 'damage', value: 4, target: 'enemy' }, { mechanism: 'applyBleed', value: 2, target: 'enemy' }], 8),
  card('bb_vampiric_cut', '吸血切割', 'blood_blade_hunter', 'attack', 2, 'starter', '造成 8 点伤害，回复 2 点生命。', [{ mechanism: 'damage', value: 8, target: 'enemy' }, { mechanism: 'heal', value: 2, target: 'self' }], 14),
  card('bb_deep_cut', '深割', 'blood_blade_hunter', 'attack', 1, 'common', '造成 5 点伤害，施加 1 层流血。', [{ mechanism: 'damage', value: 5, target: 'enemy' }, { mechanism: 'applyBleed', value: 1, target: 'enemy' }], 7),
  card('bb_blood_frenzy', '血狂', 'blood_blade_hunter', 'attack', 2, 'common', '造成 10 点伤害，施加 3 层流血。', [{ mechanism: 'damage', value: 10, target: 'enemy' }, { mechanism: 'applyBleed', value: 3, target: 'enemy' }], 16),
  card('bb_adrenaline', '肾上腺素', 'blood_blade_hunter', 'skill', 0, 'uncommon', '获得 1 点能量，抽 1 张牌，失去 2 点生命。', [{ mechanism: 'gainEnergy', value: 1, target: 'self' }, { mechanism: 'draw', value: 1, target: 'self' }, { mechanism: 'loseHp', value: 2, target: 'self' }], 6),
  card('bb_quick_slice', '快斩', 'blood_blade_hunter', 'attack', 0, 'common', '造成 3 点伤害。', [{ mechanism: 'damage', value: 3, target: 'enemy' }], 3),
  card('bb_twin_fangs', '双牙', 'blood_blade_hunter', 'attack', 1, 'common', '造成 4 点伤害两次。', [{ mechanism: 'damage', value: 4, target: 'enemy' }, { mechanism: 'damage', value: 4, target: 'enemy' }], 8),
  card('bb_open_artery', '开脉', 'blood_blade_hunter', 'attack', 1, 'common', '施加 3 层流血。', [{ mechanism: 'applyBleed', value: 3, target: 'enemy' }], 6),
  card('bb_blood_guard', '血盾', 'blood_blade_hunter', 'defense', 1, 'common', '获得 4 点格挡，施加 1 层流血。', [{ mechanism: 'block', value: 4, target: 'self' }, { mechanism: 'applyBleed', value: 1, target: 'enemy' }], 5.2),
  card('bb_predator', '猎食本能', 'blood_blade_hunter', 'skill', 1, 'common', '抽 2 张牌，失去 2 点生命。', [{ mechanism: 'draw', value: 2, target: 'self' }, { mechanism: 'loseHp', value: 2, target: 'self' }], 10),
  card('bb_rupture', '破裂', 'blood_blade_hunter', 'attack', 2, 'uncommon', '造成 11 点伤害，施加 2 层流血。', [{ mechanism: 'damage', value: 11, target: 'enemy' }, { mechanism: 'applyBleed', value: 2, target: 'enemy' }], 15),
  card('bb_sanguine', '血疗', 'blood_blade_hunter', 'skill', 1, 'uncommon', '回复 4 点生命。', [{ mechanism: 'heal', value: 4, target: 'self' }], 12),
  card('bb_crimson_flurry', '赤色乱舞', 'blood_blade_hunter', 'attack', 1, 'uncommon', '造成 5 点伤害，抽 1 张牌。', [{ mechanism: 'damage', value: 5, target: 'enemy' }, { mechanism: 'draw', value: 1, target: 'self' }], 11),
  card('bb_life_tap', '生命换能', 'blood_blade_hunter', 'skill', 0, 'common', '获得 1 点能量，失去 3 点生命。', [{ mechanism: 'gainEnergy', value: 1, target: 'self' }, { mechanism: 'loseHp', value: 3, target: 'self' }], 5),
  card('bb_hemorrhage', '大出血', 'blood_blade_hunter', 'attack', 2, 'uncommon', '造成 7 点伤害，施加 4 层流血。', [{ mechanism: 'damage', value: 7, target: 'enemy' }, { mechanism: 'applyBleed', value: 4, target: 'enemy' }], 15),
  card('bb_butcher', '屠夫', 'blood_blade_hunter', 'attack', 2, 'rare', '造成 16 点伤害，消耗。', [{ mechanism: 'damage', value: 16, target: 'enemy' }, { mechanism: 'exhaust', value: 1, target: 'self' }], 14),
  card('bb_rend', '撕裂', 'blood_blade_hunter', 'attack', 1, 'common', '造成 7 点伤害。', [{ mechanism: 'damage', value: 7, target: 'enemy' }], 7),
  card('bb_bloodlust', '嗜血', 'blood_blade_hunter', 'skill', 1, 'common', '获得 1 点力量，失去 2 点生命。', [{ mechanism: 'gainStrength', value: 1, target: 'self' }, { mechanism: 'loseHp', value: 2, target: 'self' }], 2),
  card('bb_evade', '闪避', 'blood_blade_hunter', 'defense', 1, 'common', '获得 3 点格挡，抽 1 张牌。', [{ mechanism: 'block', value: 3, target: 'self' }, { mechanism: 'draw', value: 1, target: 'self' }], 8.4),
  card('bb_fatal_cut', '致命切割', 'blood_blade_hunter', 'attack', 3, 'rare', '造成 20 点伤害。', [{ mechanism: 'damage', value: 20, target: 'enemy' }], 20),
  card('bb_coagulate', '凝血', 'blood_blade_hunter', 'skill', 1, 'uncommon', '回复 6 点生命，获得 3 点格挡。', [{ mechanism: 'heal', value: 6, target: 'self' }, { mechanism: 'block', value: 3, target: 'self' }], 20.4),
  card('bb_expose', '暴露伤口', 'blood_blade_hunter', 'skill', 1, 'common', '施加 2 层易伤。', [{ mechanism: 'applyVulnerable', value: 2, target: 'enemy' }], 8),
  card('bb_second_wind', '二度呼吸', 'blood_blade_hunter', 'defense', 2, 'uncommon', '获得 12 点格挡。', [{ mechanism: 'block', value: 12, target: 'self' }], 9.6),
];

const runeMage = [
  card('rm_arc_bolt', '弧光箭', 'rune_mage', 'attack', 1, 'starter', '造成 5 点伤害。', [{ mechanism: 'damage', value: 5, target: 'enemy' }], 5, [{ mechanism: 'damage', value: 8, target: 'enemy' }]),
  card('rm_rune_shield', '符文护盾', 'rune_mage', 'defense', 1, 'starter', '获得 6 点格挡。', [{ mechanism: 'block', value: 6, target: 'self' }], 4.8, [{ mechanism: 'block', value: 9, target: 'self' }]),
  card('rm_frost_mark', '霜印', 'rune_mage', 'skill', 1, 'starter', '施加 2 层虚弱。', [{ mechanism: 'applyWeak', value: 2, target: 'enemy' }], 8),
  card('rm_overcharge', '过载', 'rune_mage', 'skill', 0, 'starter', '下一张攻击牌伤害 +3，失去 2 点生命。', [{ mechanism: 'increaseNextAttackDamage', value: 3, target: 'self' }, { mechanism: 'loseHp', value: 2, target: 'self' }], 7),
  card('rm_chain_lightning', '连锁闪电', 'rune_mage', 'attack', 2, 'common', '造成 8 点伤害，抽 1 张牌。', [{ mechanism: 'damage', value: 8, target: 'enemy' }, { mechanism: 'draw', value: 1, target: 'self' }], 14),
  card('rm_mana_surge', '法力涌动', 'rune_mage', 'skill', 1, 'uncommon', '获得 2 点能量。', [{ mechanism: 'gainEnergy', value: 2, target: 'self' }], 16),
  card('rm_arcane_barrier', '奥术屏障', 'rune_mage', 'defense', 2, 'common', '获得 12 点格挡。', [{ mechanism: 'block', value: 12, target: 'self' }], 9.6),
  card('rm_spark', '火花', 'rune_mage', 'attack', 0, 'common', '造成 4 点伤害。', [{ mechanism: 'damage', value: 4, target: 'enemy' }], 4),
  card('rm_frost_nova', '冰霜新星', 'rune_mage', 'attack', 2, 'common', '造成 6 点伤害，施加 2 层虚弱。', [{ mechanism: 'damage', value: 6, target: 'enemy' }, { mechanism: 'applyWeak', value: 2, target: 'enemy' }], 14),
  card('rm_arcane_intellect', '奥术智慧', 'rune_mage', 'skill', 1, 'common', '抽 2 张牌。', [{ mechanism: 'draw', value: 2, target: 'self' }], 12),
  card('rm_flame_burst', '烈焰爆发', 'rune_mage', 'attack', 1, 'common', '造成 8 点伤害。', [{ mechanism: 'damage', value: 8, target: 'enemy' }], 8),
  card('rm_mana_shield', '法力护盾', 'rune_mage', 'defense', 1, 'common', '获得 5 点格挡，抽 1 张牌。', [{ mechanism: 'block', value: 5, target: 'self' }, { mechanism: 'draw', value: 1, target: 'self' }], 10),
  card('rm_element_stack', '元素叠加', 'rune_mage', 'skill', 1, 'uncommon', '施加 2 层易伤，获得 1 点力量。', [{ mechanism: 'applyVulnerable', value: 2, target: 'enemy' }, { mechanism: 'gainStrength', value: 1, target: 'self' }], 12),
  card('rm_meteor', '陨石', 'rune_mage', 'attack', 3, 'rare', '造成 22 点伤害。', [{ mechanism: 'damage', value: 22, target: 'enemy' }], 22),
  card('rm_channel', '引导', 'rune_mage', 'skill', 0, 'common', '下一张攻击牌伤害 +4，失去 1 点生命。', [{ mechanism: 'increaseNextAttackDamage', value: 4, target: 'self' }, { mechanism: 'loseHp', value: 1, target: 'self' }], 10),
  card('rm_rune_draw', '符文抽取', 'rune_mage', 'skill', 1, 'common', '抽 3 张牌，丢弃 1 张（简化为抽 2）。', [{ mechanism: 'draw', value: 2, target: 'self' }], 12),
  card('rm_static_field', '静电场', 'rune_mage', 'skill', 2, 'uncommon', '施加 3 层虚弱。', [{ mechanism: 'applyWeak', value: 3, target: 'enemy' }], 12),
  card('rm_arcane_blast', '奥术冲击', 'rune_mage', 'attack', 2, 'uncommon', '造成 14 点伤害。', [{ mechanism: 'damage', value: 14, target: 'enemy' }], 14),
  card('rm_energy_well', '能量井', 'rune_mage', 'skill', 0, 'uncommon', '获得 2 点能量，消耗。', [{ mechanism: 'gainEnergy', value: 2, target: 'self' }, { mechanism: 'exhaust', value: 1, target: 'self' }], 14),
  card('rm_poison_rune', '毒符文', 'rune_mage', 'skill', 1, 'common', '施加 3 层中毒。', [{ mechanism: 'applyPoison', value: 3, target: 'enemy' }], 6),
  card('rm_ward', '守护符文', 'rune_mage', 'defense', 1, 'uncommon', '获得 8 点格挡。', [{ mechanism: 'block', value: 8, target: 'self' }], 6.4),
  card('rm_focus', '专注', 'rune_mage', 'skill', 1, 'common', '获得 1 点能量，抽 1 张牌。', [{ mechanism: 'gainEnergy', value: 1, target: 'self' }, { mechanism: 'draw', value: 1, target: 'self' }], 14),
  card('rm_glacial_spike', '冰刺', 'rune_mage', 'attack', 2, 'rare', '造成 12 点伤害，施加 2 层虚弱。', [{ mechanism: 'damage', value: 12, target: 'enemy' }, { mechanism: 'applyWeak', value: 2, target: 'enemy' }], 20),
  card('rm_cost_cut', '减费符文', 'rune_mage', 'skill', 1, 'rare', '本场战斗卡牌费用 -1。', [{ mechanism: 'reduceCardCostThisCombat', value: 1, target: 'self' }], 4),
  card('rm_surge_bolt', '涌能箭', 'rune_mage', 'attack', 1, 'uncommon', '造成 6 点伤害，获得 1 点能量。', [{ mechanism: 'damage', value: 6, target: 'enemy' }, { mechanism: 'gainEnergy', value: 1, target: 'self' }], 14),
];

const oathKnight = [
  card('ok_shield_bash', '盾击', 'oath_knight', 'attack', 1, 'starter', '造成 4 点伤害，获得 4 点格挡。', [{ mechanism: 'damage', value: 4, target: 'enemy' }, { mechanism: 'block', value: 4, target: 'self' }], 7.2, [{ mechanism: 'damage', value: 6, target: 'enemy' }, { mechanism: 'block', value: 6, target: 'self' }]),
  card('ok_fortify', '筑垒', 'oath_knight', 'defense', 1, 'starter', '获得 7 点格挡。', [{ mechanism: 'block', value: 7, target: 'self' }], 5.6, [{ mechanism: 'block', value: 10, target: 'self' }]),
  card('ok_counter_stance', '反击姿态', 'oath_knight', 'skill', 1, 'starter', '获得 3 点格挡，获得 1 点力量。', [{ mechanism: 'block', value: 3, target: 'self' }, { mechanism: 'gainStrength', value: 1, target: 'self' }], 6.4),
  card('ok_oath_strike', '誓约重击', 'oath_knight', 'attack', 2, 'starter', '造成 12 点伤害。', [{ mechanism: 'damage', value: 12, target: 'enemy' }], 12, [{ mechanism: 'damage', value: 16, target: 'enemy' }]),
  card('ok_iron_wall', '铁壁', 'oath_knight', 'defense', 2, 'common', '获得 14 点格挡。', [{ mechanism: 'block', value: 14, target: 'self' }], 11.2),
  card('ok_holy_strike', '圣誓打击', 'oath_knight', 'attack', 2, 'uncommon', '造成 14 点伤害，获得 4 点格挡。', [{ mechanism: 'damage', value: 14, target: 'enemy' }, { mechanism: 'block', value: 4, target: 'self' }], 17.2),
  card('ok_bulwark', '壁垒', 'oath_knight', 'skill', 1, 'common', '获得 2 点力量。', [{ mechanism: 'gainStrength', value: 2, target: 'self' }], 8),
  card('ok_pommel_strike', '柄击', 'oath_knight', 'attack', 1, 'common', '造成 6 点伤害，获得 3 点格挡。', [{ mechanism: 'damage', value: 6, target: 'enemy' }, { mechanism: 'block', value: 3, target: 'self' }], 8.4),
  card('ok_hold_the_line', '坚守阵线', 'oath_knight', 'defense', 1, 'common', '获得 8 点格挡。', [{ mechanism: 'block', value: 8, target: 'self' }], 6.4),
  card('ok_rally', '集结', 'oath_knight', 'skill', 1, 'common', '获得 1 点力量，获得 4 点格挡。', [{ mechanism: 'gainStrength', value: 1, target: 'self' }, { mechanism: 'block', value: 4, target: 'self' }], 7.2),
  card('ok_heavy_slash', '重斩', 'oath_knight', 'attack', 2, 'common', '造成 13 点伤害。', [{ mechanism: 'damage', value: 13, target: 'enemy' }], 13),
  card('ok_deflect', '偏转', 'oath_knight', 'defense', 0, 'common', '获得 4 点格挡。', [{ mechanism: 'block', value: 4, target: 'self' }], 3.2),
  card('ok_armor_up', '披甲', 'oath_knight', 'skill', 1, 'uncommon', '获得 2 点敏捷。', [{ mechanism: 'gainDexterity', value: 2, target: 'self' }], 8),
  card('ok_judgment', '裁决', 'oath_knight', 'attack', 2, 'uncommon', '造成 10 点伤害，施加 2 层易伤。', [{ mechanism: 'damage', value: 10, target: 'enemy' }, { mechanism: 'applyVulnerable', value: 2, target: 'enemy' }], 18),
  card('ok_bastion', '堡垒', 'oath_knight', 'defense', 2, 'uncommon', '获得 16 点格挡。', [{ mechanism: 'block', value: 16, target: 'self' }], 12.8),
  card('ok_oath_guard', '誓约守护', 'oath_knight', 'skill', 1, 'uncommon', '获得 6 点格挡，抽 1 张牌。', [{ mechanism: 'block', value: 6, target: 'self' }, { mechanism: 'draw', value: 1, target: 'self' }], 10.8),
  card('ok_shield_wall', '盾墙', 'oath_knight', 'defense', 3, 'rare', '获得 24 点格挡。', [{ mechanism: 'block', value: 24, target: 'self' }], 19.2),
  card('ok_retaliate', '报复', 'oath_knight', 'attack', 1, 'common', '造成 5 点伤害，获得 5 点格挡。', [{ mechanism: 'damage', value: 5, target: 'enemy' }, { mechanism: 'block', value: 5, target: 'self' }], 9),
  card('ok_inspire', '鼓舞', 'oath_knight', 'skill', 1, 'common', '获得 1 点力量，抽 1 张牌。', [{ mechanism: 'gainStrength', value: 1, target: 'self' }, { mechanism: 'draw', value: 1, target: 'self' }], 10),
  card('ok_crush', '粉碎', 'oath_knight', 'attack', 3, 'rare', '造成 18 点伤害。', [{ mechanism: 'damage', value: 18, target: 'enemy' }], 18),
  card('ok_firm_stand', '稳固站姿', 'oath_knight', 'skill', 0, 'common', '获得 3 点格挡，获得 1 点力量。', [{ mechanism: 'block', value: 3, target: 'self' }, { mechanism: 'gainStrength', value: 1, target: 'self' }], 6.4),
  card('ok_parry', '招架', 'oath_knight', 'defense', 1, 'uncommon', '获得 5 点格挡，获得 1 点敏捷。', [{ mechanism: 'block', value: 5, target: 'self' }, { mechanism: 'gainDexterity', value: 1, target: 'self' }], 8),
  card('ok_oath_heal', '誓约疗愈', 'oath_knight', 'skill', 2, 'uncommon', '回复 8 点生命，获得 6 点格挡。', [{ mechanism: 'heal', value: 8, target: 'self' }, { mechanism: 'block', value: 6, target: 'self' }], 28.8),
  card('ok_unbreakable', '不屈', 'oath_knight', 'skill', 2, 'rare', '获得 3 点力量，获得 8 点格挡。', [{ mechanism: 'gainStrength', value: 3, target: 'self' }, { mechanism: 'block', value: 8, target: 'self' }], 18.4),
  card('ok_final_stand', '最终防线', 'oath_knight', 'defense', 1, 'rare', '获得 10 点格挡，保留（简化为 10 格挡）。', [{ mechanism: 'block', value: 10, target: 'self' }], 8),
];

const pools = [
  ['blood_blade_hunter.json', bloodBlade],
  ['rune_mage.json', runeMage],
  ['oath_knight.json', oathKnight],
];

fs.mkdirSync(outDir, { recursive: true });
for (const [file, cards] of pools) {
  console.log(`${file}: ${cards.length} cards`);
  fs.writeFileSync(
    path.join(outDir, file),
    JSON.stringify({ cards }, null, 2),
    'utf-8'
  );
}
console.log('Done.');
