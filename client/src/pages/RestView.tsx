import { useEffect, useState } from 'react';
import type { CardDefinition } from '@rcb/shared';
import { fetchCards, leaveEncounter, restHeal, restUpgradeCard } from '../api/gameApi';
import { useGame } from '../context/GameContext';

export default function RestView() {
  const { run, setRun } = useGame();
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCards().then(setCards);
  }, []);

  if (!run?.encounter?.rest) return null;
  const rest = run.encounter.rest;
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const upgradeOptions = (rest.upgradeOptions ?? []).filter(
    (id) => run.player.deck.includes(id) && !run.player.upgradedCards.includes(id)
  );

  async function handleHeal() {
    setLoading(true);
    setMessage('');
    try {
      const updated = await restHeal(run!.id);
      setRun(updated);
      setMessage('你休息片刻，恢复了部分生命。');
    } catch (e) {
      setMessage(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgradeCard(cardId: string) {
    setLoading(true);
    setMessage('');
    try {
      const updated = await restUpgradeCard(run!.id, cardId);
      setRun(updated);
      const name = cardMap.get(cardId)?.name ?? cardId;
      setMessage(`「${name}」已升级！`);
    } catch (e) {
      setMessage(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    const updated = await leaveEncounter(run!.id);
    setRun(updated);
  }

  return (
    <div className="page encounter-view rest-view">
      <header className="page-header">
        <h1>🔥 休息点</h1>
      </header>

      <p className="encounter-desc">
        一处安全的篝火。生命 {run.player.currentHp}/{run.player.maxHp}
      </p>

      {message && <div className="info-banner">{message}</div>}

      <div className="rest-options">
        <button
          className="btn btn-primary rest-option"
          disabled={rest.healUsed || loading}
          onClick={handleHeal}
        >
          <strong>休息恢复</strong>
          <span>回复 30% 最大生命{run.player.relics.includes('healer_salve') ? ' (+5)' : ''}</span>
          {rest.healUsed && <em>已使用</em>}
        </button>
      </div>

      {!rest.upgradeUsed && upgradeOptions.length > 0 && (
        <section className="rest-upgrade-section">
          <h3>升级卡牌（选一张）</h3>
          <div className="upgrade-card-list">
            {upgradeOptions.map((cardId) => {
              const card = cardMap.get(cardId);
              if (!card) return null;
              return (
                <button
                  key={cardId}
                  className="upgrade-card-btn"
                  disabled={loading}
                  onClick={() => handleUpgradeCard(cardId)}
                >
                  <strong>{card.name}</strong>
                  <span>{card.description}</span>
                  {card.upgradedEffects && (
                    <em>升级后效果增强</em>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
      {rest.upgradeUsed && <p className="phase-note">本休息点已升级过卡牌。</p>}

      <button className="btn btn-secondary leave-btn" onClick={handleLeave}>
        继续探索
      </button>
    </div>
  );
}
