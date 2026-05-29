import { useEffect, useState } from 'react';
import type { CardDefinition, RelicDefinition } from '@rcb/shared';
import { buyShopItem, fetchCards, fetchRelics, leaveEncounter } from '../api/gameApi';
import { useGame } from '../context/GameContext';

export default function ShopView() {
  const { run, setRun } = useGame();
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [relics, setRelics] = useState<RelicDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchCards(), fetchRelics()]).then(([c, r]) => {
      setCards(c);
      setRelics(r);
    });
  }, []);

  if (!run?.encounter?.shop) return null;
  const shop = run.encounter.shop;

  async function handleBuy(itemKey: string) {
    setLoading(true);
    setError('');
    try {
      const updated = await buyShopItem(run!.id, itemKey);
      setRun(updated);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    const updated = await leaveEncounter(run!.id);
    setRun(updated);
  }

  function getItemName(item: { id: string; type: string }) {
    if (item.type === 'card') return cards.find((c) => c.id === item.id)?.name ?? item.id;
    return relics.find((r) => r.id === item.id)?.name ?? item.id;
  }

  function getItemDesc(item: { id: string; type: string }) {
    if (item.type === 'card') return cards.find((c) => c.id === item.id)?.description ?? '';
    return relics.find((r) => r.id === item.id)?.description ?? '';
  }

  return (
    <div className="page encounter-view shop-view">
      <header className="page-header">
        <h1>🛒 地牢商店</h1>
        <span className="gold-display">金币 {run.player.gold}</span>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="shop-items">
        {shop.items.map((item) => {
          const key = `${item.type}:${item.id}`;
          const purchased = shop.purchased.includes(key) || shop.purchased.includes(item.id);
          const canAfford = run.player.gold >= item.price;
          return (
            <div key={key} className={`shop-item ${purchased ? 'sold' : ''}`}>
              <span className="item-type">{item.type === 'card' ? '卡牌' : '遗物'}</span>
              <h3>{getItemName(item)}</h3>
              <p>{getItemDesc(item)}</p>
              <div className="shop-item-footer">
                <span className="item-price">{item.price} 金币</span>
                <button
                  className="btn btn-primary"
                  disabled={purchased || !canAfford || loading}
                  onClick={() => handleBuy(key)}
                >
                  {purchased ? '已购买' : '购买'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn btn-secondary leave-btn" onClick={handleLeave}>
        离开商店
      </button>
    </div>
  );
}
