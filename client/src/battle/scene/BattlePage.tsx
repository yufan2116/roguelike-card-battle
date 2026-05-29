import type { CombatLogEntry, CombatState } from '@rcb/shared';
import type { EnemyBattleAssets, MonsterAssetMode } from '@rcb/shared';
import type { EnemyPortraitSize } from '../AnimatedCombatant';
import type { CombatantAnimState } from '../BattleEventContext';
import { BattleBackgroundLayer } from './BattleBackgroundLayer';
import { StageOverlay } from './StageOverlay';
import { MonsterSpriteLayer } from './MonsterSpriteLayer';
import { EffectLayer } from './EffectLayer';
import { EnemyIntentPanel } from '../panels/EnemyIntentPanel';
import { EnemyStatusPanel } from '../panels/EnemyStatusPanel';
import { CombatLogPanel } from '../../components/combat/CombatLogPanel';
import { PlayerStatusPanel } from '../panels/PlayerStatusPanel';
import { CombatResourcePanel } from '../panels/CombatResourcePanel';
import { HandPanel } from '../panels/HandPanel';
import { TurnActionPanel } from '../panels/TurnActionPanel';
import { CombatTopBar } from '../panels/CombatTopBar';
import type { CardDefinition } from '@rcb/shared';

export interface BattlePageProps {
  combat: CombatState;
  runClassId: string;
  relicIds: string[];
  background: string;
  assets: EnemyBattleAssets;
  assetMode: MonsterAssetMode;
  enemySize: EnemyPortraitSize;
  isBoss: boolean;
  enemyAnim: CombatantAnimState;
  playerAnim: CombatantAnimState;
  blink: boolean;
  enemyName: string;
  enemyHp: { current: number; max: number };
  enemyBlock: number;
  enemyBossPhase?: number;
  enemyStatuses: Array<{ key: string; label: string; className: string }>;
  intent: { description: string; value: number };
  combatLog: CombatLogEntry[];
  entityId: string;
  entityType: 'enemy' | 'boss';
  cardMap: Map<string, CardDefinition>;
  isPlayerTurn: boolean;
  loading: boolean;
  error?: string;
  onPlayCard: (handIndex: number) => void;
  onEndTurn: () => void;
}

/**
 * 战斗页面 — 参考 Darkest Dungeon / 月圆之夜式分层布局
 *
 * BattlePage
 *  ├── BattleBackgroundLayer
 *  ├── StageOverlay
 *  ├── MonsterSpriteLayer
 *  ├── EnemyIntentPanel
 *  ├── EnemyStatusPanel
 *  ├── CombatLogPanel
 *  ├── PlayerStatusPanel
 *  ├── CombatResourcePanel
 *  ├── HandPanel
 *  └── TurnActionPanel
 */
export function BattlePage({
  combat,
  runClassId,
  relicIds,
  background,
  assets,
  assetMode,
  enemySize,
  isBoss,
  enemyAnim,
  playerAnim,
  blink,
  enemyName,
  enemyHp,
  enemyBlock,
  enemyBossPhase,
  enemyStatuses,
  intent,
  combatLog,
  entityId,
  entityType,
  cardMap,
  isPlayerTurn,
  loading,
  error,
  onPlayCard,
  onEndTurn,
}: BattlePageProps) {
  return (
    <div className="battle-page">
      <CombatTopBar
        turn={combat.turn}
        energy={combat.player.energy}
        maxEnergy={combat.player.maxEnergy}
      />

      {error && <div className="battle-page__error error-banner">{error}</div>}

      <div className={`battle-page__stage battle-page__stage--${enemySize}`}>
        <BattleBackgroundLayer background={background} tier={enemySize} />
        <StageOverlay />

        <MonsterSpriteLayer
          portrait={assets.portrait}
          mode={assetMode}
          anim={enemyAnim}
          isBoss={isBoss}
          enemySize={enemySize}
          blink={blink}
          entityId={entityId}
          entityType={entityType}
        />

        <EnemyIntentPanel description={intent.description} value={intent.value} />

        <EnemyStatusPanel
          name={enemyName}
          hp={enemyHp}
          block={enemyBlock}
          bossPhase={enemyBossPhase}
          isBoss={isBoss}
          statuses={enemyStatuses}
        />

        <div className="battle-page__log">
          <CombatLogPanel log={combatLog} />
        </div>

        <EffectLayer enemySize={enemySize} />
      </div>

      <div className="battle-page__dock">
        <PlayerStatusPanel
          classId={runClassId}
          playerAnim={playerAnim}
          hp={{ current: combat.player.currentHp, max: combat.player.maxHp }}
          block={combat.player.block}
          strength={combat.player.strength}
          weak={combat.player.weak}
          vulnerable={combat.player.vulnerable}
          poison={combat.player.poison}
          relicIds={relicIds}
        />

        <CombatResourcePanel
          drawCount={combat.player.drawPile.length}
          discardCount={combat.player.discard.length}
          block={combat.player.block}
        />

        <TurnActionPanel disabled={!isPlayerTurn} loading={loading} onEndTurn={onEndTurn} />

        <HandPanel
          combat={combat}
          cards={cardMap}
          isPlayerTurn={isPlayerTurn}
          loading={loading}
          onPlayCard={onPlayCard}
        />
      </div>
    </div>
  );
}
