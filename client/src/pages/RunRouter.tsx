import { Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import MapView from './MapView';
import CombatView from './CombatView';
import RewardView from './RewardView';
import DefeatView from './DefeatView';
import VictoryView from './VictoryView';
import ShopView from './ShopView';
import RestView from './RestView';
import TreasureView from './TreasureView';
import EventView from './EventView';

export default function RunRouter() {
  const { run } = useGame();
  if (!run) return <Navigate to="/class-select" replace />;

  if (run.phase === 'victory') return <VictoryView />;
  if (run.phase === 'defeat') return <DefeatView />;
  if (run.phase === 'reward') return <RewardView />;
  if ((run.phase === 'combat' || run.phase === 'boss') && run.combat) {
    return <CombatView />;
  }
  if (run.phase === 'shop' && run.encounter) return <ShopView />;
  if (run.phase === 'rest' && run.encounter) return <RestView />;
  if (run.phase === 'treasure' && run.encounter) return <TreasureView />;
  if (run.phase === 'event' && run.encounter) return <EventView />;

  return <MapView />;
}
