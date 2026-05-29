import { useEffect, useState } from 'react';
import type { RelicDefinition } from '@rcb/shared';
import { claimTreasure, fetchRelics } from '../api/gameApi';
import { useGame } from '../context/GameContext';

export default function TreasureView() {
  const { run, setRun } = useGame();
  const [relics, setRelics] = useState<RelicDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRelics().then(setRelics);
  }, []);

  if (!run?.encounter?.treasure) return null;
  const treasure = run.encounter.treasure;

  const relicName =
    treasure.type === 'relic'
      ? relics.find((r) => r.id === treasure.relicId)?.name ?? '神秘遗物'
      : null;
  const relicDesc =
    treasure.type === 'relic'
      ? relics.find((r) => r.id === treasure.relicId)?.description ?? ''
      : null;

  async function handleClaim() {
    setLoading(true);
    try {
      const updated = await claimTreasure(run!.id);
      setRun(updated);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page encounter-view treasure-view">
      <header className="page-header">
        <h1>📦 宝箱</h1>
      </header>

      <div className="treasure-content">
        {treasure.type === 'relic' ? (
          <>
            <p className="treasure-label">你发现了一件遗物</p>
            <h2>{relicName}</h2>
            <p>{relicDesc}</p>
          </>
        ) : (
          <>
            <p className="treasure-label">宝箱中装满了金币</p>
            <h2>{treasure.gold} 金币</h2>
          </>
        )}
      </div>

      <button className="btn btn-primary btn-large" disabled={loading} onClick={handleClaim}>
        领取并离开
      </button>
    </div>
  );
}
