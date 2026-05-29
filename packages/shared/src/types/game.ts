/** 卡牌效果白名单机制 */
export const EFFECT_MECHANISMS = [
  'damage',
  'block',
  'draw',
  'gainEnergy',
  'heal',
  'applyBleed',
  'applyWeak',
  'applyVulnerable',
  'applyPoison',
  'exhaust',
  'retain',
  'discard',
  'loseHp',
  'gainGold',
  'addTemporaryCard',
  'reduceCardCostThisCombat',
  'increaseNextAttackDamage',
  'gainStrength',
  'gainDexterity',
] as const;

export type EffectMechanism = (typeof EFFECT_MECHANISMS)[number];

export type CardType = 'attack' | 'defense' | 'skill' | 'status' | 'curse';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'starter';
export type NodeType =
  | 'normal_combat'
  | 'elite_combat'
  | 'random_event'
  | 'shop'
  | 'rest'
  | 'treasure'
  | 'boss';

export type RunPhase =
  | 'map'
  | 'combat'
  | 'reward'
  | 'shop'
  | 'rest'
  | 'event'
  | 'treasure'
  | 'boss'
  | 'victory'
  | 'defeat';

export type ArtStylePreset =
  | 'dark_fairy_tale'
  | 'pixel'
  | 'anime'
  | 'oil_painting'
  | 'dungeon_realistic';

export type ImageEntityType = 'class' | 'card' | 'relic' | 'enemy' | 'boss';

/** @see presentation/monsterAsset.ts */
export type ImageAssetRole = 'portrait' | 'background' | 'combined';

export interface CardEffect {
  mechanism: EffectMechanism;
  value: number;
  /** 可选：目标类型，Phase 2 扩展 */
  target?: 'self' | 'enemy' | 'all_enemies' | 'random_enemy';
  /** 可选：持续回合数 */
  duration?: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  classId: string;
  type: CardType;
  cost: number;
  rarity: CardRarity;
  description: string;
  effects: CardEffect[];
  upgradedEffects?: CardEffect[];
  powerBudget: number;
  imagePrompt: string;
  imagePath?: string;
  styleTags?: string[];
}

export interface ClassDefinition {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  startingGold: number;
  starterDeck: string[];
  recommendedRelics: string[];
  imagePrompt: string;
  imagePath?: string;
  styleTags?: string[];
}

export interface RelicDefinition {
  id: string;
  name: string;
  description: string;
  /** 触发时机标识，Phase 4 实现具体逻辑 */
  trigger: string;
  /** 效果参数 */
  params: Record<string, number | string | boolean>;
  rarity: 'common' | 'uncommon' | 'rare' | 'boss';
  imagePrompt: string;
  imagePath?: string;
  styleTags?: string[];
}

export interface EnemyIntent {
  type: 'attack' | 'defend' | 'buff' | 'debuff' | 'special';
  value: number;
  description: string;
}

export interface EnemyAction {
  id: string;
  intent: EnemyIntent;
  effects: CardEffect[];
}

export interface EnemyDefinition {
  id: string;
  name: string;
  maxHp: number;
  isElite?: boolean;
  isBoss?: boolean;
  actions: EnemyAction[];
  phases?: BossPhase[];
  imagePrompt: string;
  imagePath?: string;
}

export interface BossPhase {
  phase: number;
  hpThreshold: number;
  actions: EnemyAction[];
  onEnterEffects?: CardEffect[];
}

export interface BossDefinition extends EnemyDefinition {
  isBoss: true;
  phases: BossPhase[];
}

export interface MapNode {
  id: string;
  layer: number;
  column: number;
  type: NodeType;
  connections: string[];
  visited?: boolean;
  available?: boolean;
  /** 预生成内容 ID（由 seed 决定） */
  contentId?: string;
}

export interface DungeonMap {
  seed: string;
  layers: number;
  nodes: MapNode[];
  bossNodeId: string;
}

export interface CombatLogEntry {
  turn: number;
  actor: 'player' | 'enemy' | 'system';
  message: string;
  timestamp?: number;
}

export type CombatPhase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat';

export interface CombatEnemyState {
  definitionId: string;
  name: string;
  currentHp: number;
  maxHp: number;
  block: number;
  strength: number;
  dexterity: number;
  weak: number;
  vulnerable: number;
  bleed: number;
  poison: number;
  actionIndex: number;
  intent: EnemyIntent;
  isBoss?: boolean;
  bossPhase?: number;
}

export interface CombatRelicFlags {
  firstDefenseUsed: boolean;
  firstAttackUsed: boolean;
  firstSkillUsed: boolean;
  lowHpTriggered: boolean;
  demonDiceHandIndex?: number;
  extraFirstDraw: boolean;
}

export interface CombatState {
  turn: number;
  phase: CombatPhase;
  enemies: CombatEnemyState[];
  player: RunPlayerState;
  log: CombatLogEntry[];
  /** 下一张攻击牌额外伤害 */
  nextAttackBonus: number;
  /** 本场战斗费用减免 */
  costReduction: number;
  nodeType: NodeType;
  enemyDefinitionId: string;
  rewardCardIds?: string[];
  goldReward?: number;
  relicFlags?: CombatRelicFlags;
}

/** 非战斗节点交互状态 */
export interface ShopItem {
  id: string;
  type: 'card' | 'relic';
  price: number;
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffect[];
}

export interface EventEffect {
  type: 'heal' | 'damage' | 'gold' | 'loseGold' | 'addCard' | 'addRelic' | 'maxHpUp' | 'maxHpDown';
  value?: number;
  cardId?: string;
  relicId?: string;
}

export interface NodeEncounterState {
  nodeId: string;
  nodeType: NodeType;
  contentId: string;
  shop?: {
    items: ShopItem[];
    purchased: string[];
  };
  event?: {
    eventId: string;
    title: string;
    description: string;
    choices: EventChoice[];
    resolved: boolean;
    outcomeMessage?: string;
  };
  treasure?: {
    type: 'relic' | 'gold';
    relicId?: string;
    gold?: number;
    claimed: boolean;
  };
  rest?: {
    healUsed: boolean;
    upgradeUsed: boolean;
    upgradeOptions?: string[];
  };
}

export interface RunResult {
  soulsEarned: number;
  goldCollected: number;
  nodesVisited: number;
  victory: boolean;
}

export interface RunPlayerState {
  classId: string;
  currentHp: number;
  maxHp: number;
  gold: number;
  deck: string[];
  hand: string[];
  discard: string[];
  drawPile: string[];
  exhaustPile: string[];
  relics: string[];
  /** 已升级的卡牌 id 列表 */
  upgradedCards: string[];
  energy: number;
  maxEnergy: number;
  block: number;
  /** 战斗内状态 */
  strength: number;
  dexterity: number;
  weak: number;
  vulnerable: number;
  bleed: number;
  poison: number;
}

export interface RunState {
  id: string;
  seed: string;
  phase: RunPhase;
  player: RunPlayerState;
  map: DungeonMap;
  currentNodeId: string | null;
  floor: number;
  combatLog: CombatLogEntry[];
  /** 当前战斗状态，非战斗时为 null */
  combat: CombatState | null;
  /** 非战斗节点交互状态 */
  encounter: NodeEncounterState | null;
  /** 本局结算（通关/死亡时填充） */
  runResult: RunResult | null;
  /** 元进度快照（本局继承） */
  metaBonuses: MetaProgressBonuses;
  createdAt: string;
  updatedAt: string;
}

export interface MetaProgressBonuses {
  bonusMaxHp: number;
  bonusStartingGold: number;
  unlockedClasses: string[];
  extraCardChoices: number;
  unlockedRelicPool: string[];
}

export interface MetaProgress {
  totalRuns: number;
  victories: number;
  souls: number;
  upgrades: {
    bonusMaxHp: number;
    bonusStartingGold: number;
    unlockedClasses: string[];
    extraCardChoices: number;
    unlockedRelicPool: string[];
  };
}

export interface ArtStyleVariant {
  id: string;
  preset: ArtStylePreset;
  customPrompt: string;
  imagePath: string;
  createdAt: string;
  /** 怪物分层：portrait / background / combined（默认全图） */
  role?: ImageAssetRole;
}

export interface ImageAssetRecord {
  entityType: ImageEntityType;
  entityId: string;
  variants: ArtStyleVariant[];
  activeVariantId: string | null;
  /** 怪物战斗分层绑定（enemy / boss） */
  monsterLayer?: MonsterLayerBinding;
}

export interface MonsterLayerBinding {
  portraitVariantId: string | null;
  backgroundVariantId: string | null;
}

export interface ImageAssetsRegistry {
  globalPreset: ArtStylePreset;
  records: ImageAssetRecord[];
}

/** 费用 → 最大 power budget 上限 */
export const COST_BUDGET_LIMITS: Record<number, number> = {
  0: 6,
  1: 12,
  2: 20,
  3: 30,
};

/** 机制 → power 分值 */
export const MECHANISM_POWER_VALUES: Record<EffectMechanism, number> = {
  damage: 1,
  block: 0.8,
  draw: 6,
  gainEnergy: 8,
  heal: 3,
  applyBleed: 2,
  applyWeak: 4,
  applyVulnerable: 4,
  applyPoison: 2,
  exhaust: -2,
  retain: 2,
  discard: -1,
  loseHp: -1,
  gainGold: 1,
  addTemporaryCard: 3,
  reduceCardCostThisCombat: 4,
  increaseNextAttackDamage: 3,
  gainStrength: 4,
  gainDexterity: 4,
};

export const ART_STYLE_PRESETS: Record<
  ArtStylePreset,
  { label: string; promptSuffix: string }
> = {
  dark_fairy_tale: {
    label: '暗黑童话',
    promptSuffix: 'muted storybook palette, soft ink outlines, fairy tale mood',
  },
  pixel: {
    label: '像素风',
    promptSuffix: 'pixel art game sprite, limited color palette, crisp pixels',
  },
  anime: {
    label: '二次元',
    promptSuffix: 'anime game sprite, flat cel shading, bold outlines',
  },
  oil_painting: {
    label: '绘本风',
    promptSuffix: 'painted storybook texture, soft brush strokes, muted tones',
  },
  dungeon_realistic: {
    label: '地牢风',
    promptSuffix: 'gritty dungeon crawler game art, torchlit mood, simple forms',
  },
};

export const PLACEHOLDER_IMAGE = '/assets/placeholder.svg';
