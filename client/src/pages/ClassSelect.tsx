import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CardDefinition, ClassDefinition, RelicDefinition } from '@rcb/shared';
import { fetchCards, fetchClasses, fetchMeta, fetchRelics, getImageUrl, startRun } from '../api/gameApi';
import { CardFace } from '../components/cards/CardFace';
import { useGame } from '../context/GameContext';

export default function ClassSelect() {
  const navigate = useNavigate();
  const { setRun } = useGame();
  const [classes, setClasses] = useState<ClassDefinition[]>([]);
  const [relics, setRelics] = useState<RelicDefinition[]>([]);
  const [cards, setCards] = useState<CardDefinition[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startingRelicId, setStartingRelicId] = useState<string | null>(null);
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchClasses(), fetchMeta(), fetchRelics(), fetchCards()])
      .then(([classList, meta, relicList, cardList]) => {
        setClasses(classList);
        setRelics(relicList);
        setCards(cardList);
        setUnlocked(meta.upgrades.unlockedClasses);
        setSelectedId(classList[0]?.id ?? null);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const selected = classes.find((c) => c.id === selectedId);
  const recommendedRelics = selected
    ? relics.filter((r) => selected.recommendedRelics.includes(r.id))
    : [];
  const starterCards = selected
    ? selected.starterDeck
        .map((id) => cards.find((c) => c.id === id))
        .filter(Boolean) as CardDefinition[]
    : [];

  useEffect(() => {
    if (recommendedRelics.length > 0) {
      setStartingRelicId(recommendedRelics[0].id);
    } else {
      setStartingRelicId(null);
    }
  }, [selectedId, relics]);

  async function handleStart() {
    if (!selectedId) return;
    setStarting(true);
    setError('');
    try {
      const run = await startRun(
        selectedId,
        seed.trim() || undefined,
        startingRelicId ?? undefined
      );
      setRun(run);
      navigate('/run');
    } catch (e) {
      setError(String(e));
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return <div className="page loading-page">加载职业数据…</div>;
  }

  return (
    <div className="page class-select class-select--phase9">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1>选择职业</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="class-select-layout">
        <div className="class-portrait-grid">
          {classes.map((cls) => {
            const isLocked = !unlocked.includes(cls.id);
            const isSelected = cls.id === selectedId;
            return (
              <button
                key={cls.id}
                type="button"
                className={`class-portrait-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => !isLocked && setSelectedId(cls.id)}
                disabled={isLocked}
              >
                <div className="class-portrait-card__frame">
                  <img src={getImageUrl(cls.imagePath)} alt={cls.name} />
                </div>
                <div className="class-portrait-card__info">
                  <h3>{cls.name}</h3>
                  <p>{cls.description}</p>
                  <div className="class-stats">
                    <span>❤ {cls.maxHp}</span>
                    <span>◎ {cls.startingGold}</span>
                    <span>🃏 {cls.starterDeck.length}</span>
                  </div>
                </div>
                {isLocked && <span className="lock-badge">未解锁</span>}
              </button>
            );
          })}
        </div>

        {selected && (
          <aside className="class-detail-panel">
            <div className="class-detail-portrait">
              <img src={getImageUrl(selected.imagePath)} alt={selected.name} />
            </div>
            <h2>{selected.name}</h2>
            <p className="class-detail-desc">{selected.description}</p>

            <dl className="class-detail-stats">
              <div>
                <dt>生命</dt>
                <dd>{selected.maxHp}</dd>
              </div>
              <div>
                <dt>起始金币</dt>
                <dd>{selected.startingGold}</dd>
              </div>
              <div>
                <dt>初始卡组</dt>
                <dd>{selected.starterDeck.length} 张</dd>
              </div>
            </dl>

            {recommendedRelics.length > 0 && (
              <div className="starting-relic-picker">
                <span>推荐起始遗物</span>
                <div className="relic-options">
                  {recommendedRelics.map((relic) => (
                    <button
                      key={relic.id}
                      type="button"
                      className={`relic-option ${startingRelicId === relic.id ? 'selected' : ''}`}
                      onClick={() => setStartingRelicId(relic.id)}
                    >
                      <strong>{relic.name}</strong>
                      <span>{relic.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {starterCards.length > 0 && (
              <div className="starter-deck-preview">
                <h4>初始卡组预览</h4>
                <div className="starter-deck-grid">
                  {starterCards.map((card) => (
                    <CardFace key={card.id} card={card} variant="preview" />
                  ))}
                </div>
              </div>
            )}

            <label className="seed-input">
              <span>Seed（可选，相同 seed 生成相同地图）</span>
              <input
                type="text"
                placeholder="留空则随机，如 ABC123"
                value={seed}
                onChange={(e) => setSeed(e.target.value.toUpperCase())}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary btn-large btn-block"
              onClick={handleStart}
              disabled={starting}
            >
              {starting ? '进入地下城…' : '进入地下城'}
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}
