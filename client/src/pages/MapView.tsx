import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClassDefinition } from '@rcb/shared';
import { abandonRun, fetchClasses, selectMapNode } from '../api/gameApi';
import { DungeonMapCanvas } from '../components/map/DungeonMapCanvas';
import { RunStatusPanel } from '../components/map/RunStatusPanel';
import { useGame } from '../context/GameContext';

export default function MapView() {
  const navigate = useNavigate();
  const { run, setRun, clearRun } = useGame();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [classes, setClasses] = useState<ClassDefinition[]>([]);

  useEffect(() => {
    fetchClasses().then(setClasses).catch(console.error);
  }, []);

  if (!run) return null;

  const availableNodes = run.map.nodes.filter((n) => n.available && !n.visited);
  const visitedCount = run.map.nodes.filter((n) => n.visited).length;
  const className =
    classes.find((c) => c.id === run.player.classId)?.name ?? run.player.classId;

  async function handleSelectNode(nodeId: string) {
    setLoading(true);
    setMessage('');
    try {
      const updated = await selectMapNode(run!.id, nodeId);
      setRun(updated);
    } catch (e) {
      setMessage(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleAbandon() {
    if (!confirm('放弃本局？将按失败结算灵魂。')) return;
    setLoading(true);
    try {
      await abandonRun(run!.id);
      clearRun();
      navigate('/');
    } catch (e) {
      setMessage(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page map-view map-view--phase9">
      <header className="run-header">
        <div>
          <h1>地下城路线</h1>
          <p className="run-meta">
            Seed: <code>{run.seed}</code> · 已访问 {visitedCount} 节点
          </p>
        </div>
      </header>

      {message && <div className="info-banner">{message}</div>}

      <div className="map-layout">
        <div className="map-route-panel">
          <DungeonMapCanvas
            nodes={run.map.nodes}
            layers={run.map.layers}
            loading={loading}
            onSelectNode={handleSelectNode}
          />
        </div>

        <RunStatusPanel
          run={run}
          classDisplayName={className}
          availableCount={availableNodes.length}
          loading={loading}
          onAbandon={handleAbandon}
        />
      </div>
    </div>
  );
}
