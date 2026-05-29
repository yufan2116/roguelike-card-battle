import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSaveSlots } from '../api/gameApi';
import { useMeta } from '../context/MetaContext';

export default function MainMenu() {
  const navigate = useNavigate();
  const { meta } = useMeta();
  const [continuableCount, setContinuableCount] = useState(0);

  useEffect(() => {
    fetchSaveSlots()
      .then((saves) => setContinuableCount(saves.filter((s) => s.continuable).length))
      .catch(() => setContinuableCount(0));
  }, []);

  return (
    <div className="page main-menu">
      <div className="menu-bg-glow" />
      <header className="menu-header">
        <p className="menu-subtitle">Roguelike Card Battle</p>
        <h1 className="menu-title">遗迹吞忆</h1>
        <p className="menu-tagline">
          地下城吸收进入者的记忆，将恐惧化为怪物。深入、收集、幸存。
        </p>
        {meta && (
          <div className="menu-meta-bar">
            <span className="menu-souls">✦ {meta.souls} 灵魂</span>
            <span>探索 {meta.totalRuns} · 通关 {meta.victories}</span>
          </div>
        )}
      </header>

      <nav className="menu-actions">
        <button className="btn btn-primary btn-menu-main" onClick={() => navigate('/class-select')}>
          开始探索
        </button>
        <button
          className="btn btn-secondary btn-menu-main"
          onClick={() => navigate('/continue')}
          disabled={continuableCount === 0}
        >
          继续存档{continuableCount > 0 ? ` (${continuableCount})` : ''}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/meta')}>
          元进度 · 灵魂祭坛
        </button>
        <div className="menu-tools-row">
          <button className="btn btn-secondary" onClick={() => navigate('/balance-lab')}>
            平衡实验室
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/content-forge')}>
            内容工坊
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/art-studio')}>
            美术工坊
          </button>
        </div>
      </nav>

      <footer className="menu-footer">
        <span>Phase 9 · 表现层重构 · Seed 可复现</span>
      </footer>
    </div>
  );
}
