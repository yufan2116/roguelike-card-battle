import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useMeta } from '../context/MetaContext';

export default function DefeatView() {
  const navigate = useNavigate();
  const { run, clearRun } = useGame();
  const { refreshMeta } = useMeta();

  useEffect(() => {
    refreshMeta().catch(console.error);
  }, [refreshMeta]);

  function handleRetry() {
    clearRun();
    navigate('/class-select');
  }

  function handleMenu() {
    clearRun();
    navigate('/');
  }

  function handleMeta() {
    clearRun();
    navigate('/meta');
  }

  return (
    <div className="page defeat-view">
      <div className="defeat-content">
        <h1>你已倒下</h1>
        <p>地下城吸收了你的记忆，恐惧仍在蔓延……</p>

        {run?.runResult && (
          <div className="run-result-panel">
            <h3>本局结算</h3>
            <ul>
              <li>获得灵魂：{run.runResult.soulsEarned}</li>
              <li>访问节点：{run.runResult.nodesVisited}</li>
              <li>收集金币：{run.runResult.goldCollected}</li>
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
