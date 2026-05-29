import type { ReactNode } from 'react';
import type { CombatLogEntry } from '@rcb/shared';
import type { EnemyPortraitSize } from '../AnimatedCombatant';
import { BackgroundLayer } from './BackgroundLayer';
import { MonsterLayer } from './MonsterLayer';
import { EffectLayer } from './EffectLayer';
import { EnemyUILayer } from './EnemyUILayer';
import { CombatLogPanel } from '../../components/combat/CombatLogPanel';
import type { CombatantAnimState } from '../BattleEventContext';
import type { ResolvedMonsterAsset } from '@rcb/shared';

export interface BattleSceneProps {
  monsterAsset: ResolvedMonsterAsset;
  enemySize: EnemyPortraitSize;
  isBoss: boolean;
  enemyAnim: CombatantAnimState;
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
  children?: ReactNode;
}

export function BattleScene({
  monsterAsset,
  enemySize,
  isBoss,
  enemyAnim,
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
}: BattleSceneProps) {
  return (
    <section className="battle-scene">
      <BackgroundLayer
        background={monsterAsset.background}
        mode={monsterAsset.mode}
        tier={enemySize}
      />

      <div className="battle-scene__stage">
        <MonsterLayer
          portrait={monsterAsset.portrait}
          mode={monsterAsset.mode}
          anim={enemyAnim}
          isBoss={isBoss}
          enemySize={enemySize}
          blink={blink}
          entityId={entityId}
          entityType={entityType}
        />

        <EnemyUILayer
          name={enemyName}
          hp={enemyHp}
          block={enemyBlock}
          bossPhase={enemyBossPhase}
          isBoss={isBoss}
          intent={intent}
          statuses={enemyStatuses}
        />

        <EffectLayer enemySize={enemySize} />

        <div className="battle-scene__log">
          <CombatLogPanel log={combatLog} />
        </div>
      </div>
    </section>
  );
}
