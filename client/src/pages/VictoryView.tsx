import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useMeta } from '../context/MetaContext';

export default function VictoryView() {
  const navigate = useNavigate();
  const { run, clearRun } = useGame();
  const { refreshMeta } = useMeta();

  useEffect(() => {
    refreshMeta().catch(console.error);
  }, [refreshMeta]);

  if (!run) return null;

  const result = run.runResult;

  function handleMenu() {
    clearRun();
    navigate('/');
  }

  function handleRetry() {
    clearRun();
    navigate('/class-select');
  }

  function handleMeta() {
    clearRun();
    navigate('/meta');
  }

  return (
    <div className="page victory-view">
      <div className="victory-content">
        <h1>通关！</h1>
        <p className="victory-subtitle">遗迹吞忆者已被击败，你带着宝物离开了地下城。</p>

        {result && (
          <div className="run-result-panel">
            <h3>本局结算</h3>
            <ul>
              <li>获得灵魂：{result.soulsEarned}</li>
              <li>收集金币：{result.goldCollected}</li>
              <li>访问节点：{result.nodesVisited}</li>
              <li>遗物数量：{run.player.relics.length}</li>
              <li>卡组规模：{run.player.deck.length} 张</li>
            </ul>
          </div>
        )}

        <div className="defeat-actions">
          <button className="btn btn-primary" onClick={handleMeta}>
            灵魂祭坛
          </button>
          <button className="btn btn-secondary" onClick={handleRetry}>
            再次挑战
          </button>
          <button className="btn btn-ghost" onClick={handleMenu}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}
