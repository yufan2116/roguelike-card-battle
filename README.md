# 遗迹吞忆 · Roguelike Card Battle

轻量级回合制卡牌肉鸽 Demo，参考《杀戮尖塔》《月圆之夜》等玩法结构，原创内容与机制。

## 项目架构

```
roguelike-card-battle/
├── packages/shared/     # 共享：类型、Schema、Seed RNG、游戏逻辑（与 UI 分离）
├── client/              # React + Vite 前端（纯展示 + 调用 API）
├── server/              # Express 后端（数据校验、存档、AI 接口）
├── data/                # JSON 游戏内容（职业、卡牌、遗物、敌人）
├── assets/              # 图片资源（含 AI 生成结果）
└── .env                 # API Key 配置（不提交 git）
```

### 设计原则

| 原则 | 实现 |
|------|------|
| 逻辑与 UI 分离 | 核心逻辑在 `@rcb/shared`，前端只渲染状态 |
| Seed 可复现 | `seedrandom` 驱动地图、掉落、遭遇 |
| AI 输出必校验 | LLM/图片 API 仅在后端调用，Zod Schema + Power Budget |
| 图片持久化 | 生成后写入 `assets/`，游戏只读 `imagePath` |
| 失败有 fallback | 占位图 `/assets/placeholder.svg` |

## Phase 1 已实现

- [x] Monorepo 项目结构
- [x] 核心 TypeScript 类型与 Zod Schema
- [x] Power Budget 校验工具
- [x] Seed 地图生成
- [x] Express API（职业、卡牌、开始游戏、选节点）
- [x] React UI：主菜单 → 职业选择 → 地下城地图

## Phase 2 已实现

- [x] 回合制战斗引擎（`packages/shared/src/game/combatEngine.ts`）
- [x] 抽牌 / 弃牌 / 能量 / 手牌管理
- [x] 卡牌效果（伤害、格挡、抽牌、能量、治疗、流血、虚弱、易伤、中毒、力量等）
- [x] 8 种敌人 + 意图显示 + 回合行动
- [x] 战斗日志（逐条记录，UI 可滚动查看）
- [x] 战斗胜利 → 三选一卡牌奖励 → 返回地图
- [x] 战斗失败 → 死亡结算页

## Phase 3 已实现

- [x] 商店 / 休息 / 宝箱 / 事件 / Boss 两阶段 / 元进度结算

## Phase 4 已实现

- [x] 三职业各 **25 张**卡牌（`data/cards/*.json`）
- [x] **15 件**遗物，统一 `relicEngine` 管理
- [x] 职业起始遗物选择（推荐遗物二选一）
- [x] 休息点 **卡牌升级**（使用 `upgradedEffects`）
- [x] 战斗奖励按节点类型加权（精英/Boss 更易出稀有卡）
- [x] 新遗物：荆棘镣铐、奥术电池、猎人信物、誓约之盾、记忆王冠

## Phase 5 已实现

- [x] **AI 图片生成**（后端调用 DALL·E 兼容 API，Key 写入 `.env` 的 `IMAGE_API_KEY`）
- [x] 无 API Key 时自动生成本地 **SVG 占位图**
- [x] 图片持久化到 `assets/generated/`，注册表 `data/imageAssets.json`
- [x] **5 种风格预设** + 自定义 Prompt
- [x] 同一实体多风格变体，游戏内切换 active 变体
- [x] **美术工坊**页面（主菜单 → 美术工坊）

## Phase 6 已实现

- [x] **LLM 职业 + 卡池生成**（`LLM_API_KEY` 与 `IMAGE_API_KEY` **独立配置**）
- [x] 无 LLM Key 时 **规则模板 fallback**，仍走完整校验管道
- [x] **Zod Schema** 校验（`GeneratedClassPackSchema`）
- [x] **Power Budget** 逐卡数值预算检查
- [x] **战斗模拟**（贪心 AI vs 精英敌人；真实 LLM 生成时强制，模板 fallback 跳过）
- [x] 草稿 → 校验报告 → **批准写入** `classes.json` + `data/cards/{classId}.json`
- [x] 批准后自动解锁职业（写入 `meta.json`）
- [x] **内容工坊** UI（主菜单 → 内容工坊）

## Phase 7 已实现

- [x] **扩展战斗模拟**：3 种 AI 策略（greedy / defensive / aggressive）
- [x] **多场景套件**：普通 / 精英 / Boss + 全卡池 vs 精英
- [x] **Power Budget 全局审计** + 自动修复建议
- [x] **职业平衡矩阵**：胜率、期望区间、评级（平衡/过易/过难/异常）
- [x] **综合评分**（0–100）与调优建议
- [x] **平衡实验室** UI + REST API + CLI（`npm run balance`）
- [x] 报告持久化 `data/balance/lastReport.json`
- [x] Phase 6 生成校验接入场景化期望胜率

## Phase 8 已实现

- [x] **多存档槽位**：服务端 `data/saves/{runId}.json` 自动持久化
- [x] **继续存档**页面：列出进行中存档，支持继续 / 放弃 / 删除
- [x] **放弃本局**：地图页与存档页调用 API，按失败结算灵魂
- [x] **元进度 · 灵魂祭坛**：4 种永久升级（体魄 / 金袋 / 抉择 / 遗物库）
- [x] **灵魂货币**：通关或死亡结算获得，仅作用于**新开始**的探索
- [x] **localStorage** 记录最近 runId（`rcb_last_run_id`）
- [x] **MetaProvider / GameProvider** 全局状态与 UI 打磨（加载动画、主菜单灵魂数）

### 存档与元进度架构

```
每局操作 → 服务端自动写入 data/saves/{runId}.json
    ↓
继续存档页 / localStorage 最近 ID
    ↓
通关或失败 → 结算灵魂 → data/meta.json
    ↓
灵魂祭坛购买永久升级 → 下一局起始属性 / 遗物池
```

### 平衡架构

```
职业 + 卡池 + 敌人
    ↓
多策略 × 多场景 自动对战（combatEngine）
    ↓
胜率 vs 期望区间 → 评级
    +
Power Budget 审计
    ↓
综合分 + 调优建议
```

### 图片架构

```
imagePrompt (JSON 数据)
    ↓
buildImagePrompt() + 风格预设
    ↓
Image API (或 SVG Fallback)
    ↓
assets/generated/{type}/{id}/{variant}.png
    ↓
data/imageAssets.json（变体注册表）
    ↓
游戏 UI 只读 imagePath
```

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 构建 shared 包

```bash
npm run build -w packages/shared
```

### 3. 启动开发服务器（前后端同时）

```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001

### 4. 测试流程

1. 打开 http://localhost:5173
2. 主菜单可查看灵魂数；点击「开始探索」或「继续存档」
3. 选择三个职业之一（血刃猎人 / 符文法师 / 旧誓骑士）
4. 可选输入 Seed（如 `TEST123`），相同 Seed 地图一致
5. 点击「进入地下城」
6. 在地图上点击可用节点（第一层 3 个均可选）
7. 通关或失败后可在「灵魂祭坛」消费灵魂升级永久属性

## 环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

| 变量 | 用途 |
|------|------|
| `IMAGE_API_KEY` | Phase 5 图片生成（DALL·E 等） |
| `LLM_API_KEY` | Phase 6 文本/JSON 生成（GPT 等） |

两者**独立**，可只配其中一个。

## 后续 Phase 计划

Phase 1–8 核心 Demo 已闭环。可选后续方向：SQLite 迁移、移动端适配、联机观战、更多职业与事件等。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/game/classes` | 获取职业列表 |
| GET | `/api/game/cards` | 获取全部卡牌 |
| GET | `/api/game/enemies` | 获取敌人列表 |
| GET | `/api/game/meta` | 元进度 |
| POST | `/api/game/meta/purchase` | 购买元升级 `{ upgradeId }` |
| GET | `/api/game/saves` | 存档槽位列表 |
| POST | `/api/game/runs` | 开始新游戏 `{ classId, seed? }` |
| GET | `/api/game/runs/:id` | 获取存档 |
| DELETE | `/api/game/runs/:id` | 删除存档文件 |
| POST | `/api/game/runs/:id/abandon` | 放弃本局（失败结算） |
| POST | `/api/game/runs/:id/select-node` | 选择地图节点（战斗节点自动开战） |
| POST | `/api/game/runs/:id/combat/play-card` | 打出卡牌 `{ handIndex }` |
| POST | `/api/game/runs/:id/combat/end-turn` | 结束回合 |
| POST | `/api/game/runs/:id/reward/select` | 选择奖励卡牌 `{ cardId }` |
| POST | `/api/game/runs/:id/reward/skip` | 跳过奖励 |
| POST | `/api/game/runs/:id/shop/buy` | 商店购买 `{ itemKey }` |
| POST | `/api/game/runs/:id/rest/heal` | 休息恢复 |
| POST | `/api/game/runs/:id/rest/upgrade` | 休息强化 |
| POST | `/api/game/runs/:id/treasure/claim` | 领取宝箱 |
| POST | `/api/game/runs/:id/event/choose` | 事件选择 `{ choiceId }` |
| POST | `/api/game/runs/:id/encounter/leave` | 离开当前遭遇（商店等） |
| GET | `/api/game/relics` | 遗物列表 |
| GET | `/api/images/presets` | 美术风格预设列表 |
| GET | `/api/images/status` | 图片 API 配置状态 |
| GET | `/api/images/registry` | 完整图片注册表 |
| GET | `/api/images/entities/:type` | 按类型列出可生成实体 |
| GET | `/api/images/resolve/:type/:id` | 解析实体当前 active 图片 |
| POST | `/api/images/generate` | 生成单张 `{ entityType, entityId, preset, customPrompt? }` |
| POST | `/api/images/generate-batch` | 批量生成 `{ entityType, preset, limit? }` |
| POST | `/api/images/active-variant` | 切换变体 `{ entityType, entityId, variantId }` |
| POST | `/api/images/global-preset` | 设置默认风格 `{ preset }` |
| GET | `/api/llm/status` | LLM API 配置状态 |
| GET | `/api/llm/drafts` | 生成草稿列表 |
| GET | `/api/llm/drafts/:id` | 单个草稿详情 |
| POST | `/api/llm/generate-class` | LLM 生成职业包 `{ theme, nameHint?, classIdPrefix?, cardCount?, userPrompt? }` |
| POST | `/api/llm/drafts/:id/revalidate` | 重新校验草稿 |
| POST | `/api/llm/drafts/:id/approve` | 批准写入游戏数据 `{ unlockClass? }` |
| DELETE | `/api/llm/drafts/:id` | 删除草稿 |
| GET | `/api/balance/scenarios` | 平衡测试场景列表 |
| GET | `/api/balance/report` | 最近一次全局审计报告 |
| POST | `/api/balance/simulate` | 单次模拟 `{ classId, enemyId, strategy?, deckMode?, runs? }` |
| POST | `/api/balance/audit/class` | 单职业审计 `{ classId, runsPerCell? }` |
| POST | `/api/balance/audit/all` | 全局平衡审计 `{ runsPerCell? }` |

## 技术栈

- **前端**: React 19 + TypeScript + Vite + React Router
- **后端**: Node.js + Express + TypeScript
- **共享**: Zod + seedrandom
- **存储**: JSON 文件（`data/saves/`、`data/meta.json`；后续可迁移 SQLite）
