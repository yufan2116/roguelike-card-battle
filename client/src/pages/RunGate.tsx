import { Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import RunRouter from './RunRouter';

/** 校验 run 状态后进入游戏流程 */
export default function RunGate() {
  const { run } = useGame();
  if (!run) return <Navigate to="/continue" replace />;
  return <RunRouter />;
}
