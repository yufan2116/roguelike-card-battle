import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  META_UPGRADE_CATALOG,
  getUpgradeCost,
  getUpgradeLevel,
  type MetaUpgradeId,
} from '@rcb/shared';
import { purchaseMetaUpgrade } from '../api/gameApi';
import { useMeta } from '../context/MetaContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

export default function MetaProgressView() {
  const navigate = useNavigate();
  const { meta, loading, setMeta } = useMeta();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handlePurchase(upgradeId: MetaUpgradeId) {
    setPurchasing(upgradeId);
    setError('');
    setMessage('');
    try {
      const result = await purchaseMetaUpgrade(upgradeId);
      setMeta(result.meta);
      setMessage(result.message);
    } catch (e) {
      setError(String(e));
    } finally {
      setPurchasing(null);
    }
  }

  if (loading || !meta) {
    return (
      <div className="page meta-view">
        <LoadingOverlay label="加载元进度…" />
      </div>
    );
  }

  return (
    <div className="page meta-view">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          ← 返回主菜单
        </button>
        <h1>元进度 · 灵魂祭坛</h1>
      </header>

      <div className="meta-summary-panel">
        <div className="souls-display">
          <span className="souls-icon">✦</span>
          <span className="souls-count">{meta.souls}</span>
          <span className="souls-label">灵魂</span>
        </div>
        <div className="meta-stats-row">
          <span>总探索 {meta.totalRuns} 次</span>
          <span>通关 {meta.victories} 次</span>
          <span>
            永久加成：+{meta.upgrades.bonusMaxHp} HP · +{meta.upgrades.bonusStartingGold} 金
          </span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <div className="meta-upgrade-grid">
        {META_UPGRADE_CATALOG.map((def) => {
          const level = getUpgradeLevel(meta, def.id);
          const maxed = level >= def.maxLevel;
          const cost = maxed ? 0 : getUpgradeCost(def, level);
          const canAfford = meta.souls >= cost;

          return (
            <article key={def.id} className={`meta-upgrade-card ${maxed ? 'maxed' : ''}`}>
              <h3>{def.name}</h3>
              <p>{def.description}</p>
              <p className="effect-label">{def.effectLabel}</p>
              <div className="upgrade-level">
                Lv.{level} / {def.maxLevel}
              </div>
              <button
                className="btn btn-primary"
                disabled={maxed || !canAfford || purchasing === def.id}
                onClick={() => handlePurchase(def.id)}
              >
                {maxed ? '已满级' : purchasing === def.id ? '购买中…' : `升级 · ${cost} 灵魂`}
              </button>
            </article>
          );
        })}
      </div>

      {meta.upgrades.unlockedRelicPool.length > 0 && (
        <section className="unlocked-relics">
          <h3>已解锁额外遗物</h3>
          <p>{meta.upgrades.unlockedRelicPool.join(' · ')}</p>
        </section>
      )}

      <p className="meta-hint">灵魂通过通关/死亡结算获得，永久升级仅作用于<strong>新开始</strong>的探索。</p>
    </div>
  );
}
