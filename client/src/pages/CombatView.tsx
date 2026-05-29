import { useEffect, useState } from 'react';
import type { CardDefinition } from '@rcb/shared';
import { endCombatTurn, fetchCards, playCombatCard } from '../api/gameApi';
import { useGame } from '../context/GameContext';
import { BattleEventProvider, useBattleEvents } from '../battle/BattleEventContext';
import { useCombatEventSync } from '../battle/useCombatEventSync';
import { useEnemyIdleEffects } from '../battle/useEnemyIdleEffects';
import { useBattlePresentation } from '../battle/useBattlePresentation';
import { BattlePage } from '../battle/scene/BattlePage';

export default function CombatView() {
  return (
    <BattleEventProvider>
      <CombatViewInner />
    </BattleEventProvider>
  );
}

function CombatViewInner() {
  const { run, setRun } = useGame();
  const { emitOne, presentation } = useBattleEvents();
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCards().then(setCards).catch(console.error);
  }, []);

  useCombatEventSync(run?.combat);

  const combat = run?.combat;
  const enemy = combat?.enemies[0];
  const entityType = enemy?.isBoss ? 'boss' : 'enemy';
  const nodeType = combat?.nodeType ?? 'normal_combat';

  const { assets, background, mode } = useBattlePresentation(
    entityType,
    enemy?.definitionId ?? '',
    nodeType
  );
  const { blink } = useEnemyIdleEffects(!!enemy?.isBoss);

  if (!combat || !enemy || !run) return null;

  const isPlayerTurn = combat.phase === 'player_turn';
  const isBoss = !!enemy.isBoss;
  const isElite = combat.nodeType === 'elite_combat';
  const enemySize = isBoss ? 'boss' : isElite ? 'elite' : 'normal';
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const enemyStatuses = [
    enemy.bleed > 0 && { key: 'bleed', label: `🩸 ${enemy.bleed}`, className: 'bleed' },
    enemy.vulnerable > 0 && { key: 'vuln', label: `💢 ${enemy.vulnerable}`, className: 'vuln' },
    enemy.weak > 0 && { key: 'weak', label: `😵 ${enemy.weak}`, className: 'weak' },
  ].filter(Boolean) as Array<{ key: string; label: string; className: string }>;

  async function handlePlayCard(handIndex: number) {
    if (!run?.combat || loading) return;
    const card = cardMap.get(run.combat.player.hand[handIndex]);
    if (!card) return;

    emitOne({
      type: 'card_fly',
      sourceId: 'player',
      targetId: 'enemy_0',
      cardName: card.name,
      handIndex,
    });

    setLoading(true);
    setError('');
    try {
      const updated = await playCombatCard(run.id, handIndex);
      setRun(updated);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleEndTurn() {
    if (!run || loading) return;
    setLoading(true);
    setError('');
    try {
      const updated = await endCombatTurn(run.id);
      setRun(updated);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="battle-view-wrapper">
      <BattlePage
        combat={combat}
        runClassId={run.player.classId}
        relicIds={run.player.relics}
        background={background}
        assets={assets}
        assetMode={mode}
        enemySize={enemySize}
        isBoss={isBoss}
        enemyAnim={presentation.enemyAnim}
        playerAnim={presentation.playerAnim}
        blink={blink}
        enemyName={enemy.name}
        enemyHp={{ current: enemy.currentHp, max: enemy.maxHp }}
        enemyBlock={enemy.block}
        enemyBossPhase={enemy.bossPhase}
        enemyStatuses={enemyStatuses}
        intent={enemy.intent}
        combatLog={combat.log}
        entityId={enemy.definitionId}
        entityType={entityType}
        cardMap={cardMap}
        isPlayerTurn={isPlayerTurn}
        loading={loading}
        error={error}
        onPlayCard={handlePlayCard}
        onEndTurn={handleEndTurn}
      />
    </div>
  );
}
