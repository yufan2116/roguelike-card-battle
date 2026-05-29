import { useEffect, useState } from 'react';
import type { CardDefinition } from '@rcb/shared';
import { CardFace } from '../components/cards/CardFace';
import { fetchCards, selectRewardCard, skipReward } from '../api/gameApi';
import { useGame } from '../context/GameContext';
import { useImageAssets } from '../context/ImageAssetContext';

export default function RewardView() {
  const { run, setRun } = useGame();
  const { refresh: refreshImages } = useImageAssets();
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchCards(), refreshImages()])
      .then(([cardList]) => setCards(cardList))
      .catch(console.error);
  }, [refreshImages]);

  if (!run?.combat?.rewardCardIds) {
    return (
      <div className="page loading-page">
        加载奖励…
        {!loading && (
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setLoading(true);
              const updated = await skipReward(run!.id);
              setRun(updated);
            }}
          >
            跳过
          </button>
        )}
      </div>
    );
  }

  const rewardIds = run.combat.rewardCardIds;
  const rewardCards = rewardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter(Boolean) as CardDefinition[];

  async function handleSelect(cardId: string) {
    setLoading(true);
    try {
      const updated = await selectRewardCard(run!.id, cardId);
      setRun(updated);
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      const updated = await skipReward(run!.id);
      setRun(updated);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page reward-view">
      <header className="page-header">
        <h1>战斗胜利！</h1>
      </header>

      <p className="reward-gold">
        获得 {run.combat.goldReward ?? 25} 金币 · 选择一张卡牌加入卡组
      </p>

      <div className="reward-cards">
        {rewardCards.map((card) => (
          <CardFace
            key={card.id}
            card={card}
            variant="reward"
            disabled={loading}
            onClick={() => handleSelect(card.id)}
          />
        ))}
      </div>

      <button className="btn btn-secondary" onClick={handleSkip} disabled={loading}>
        跳过奖励
      </button>
    </div>
  );
}
