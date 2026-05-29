import type { MapNode } from '@rcb/shared';
import { NODE_TYPE_LABELS } from '@rcb/shared';

const NODE_ICONS: Record<string, string> = {
  normal_combat: '⚔',
  elite_combat: '💀',
  random_event: '❓',
  shop: '🛒',
  rest: '🔥',
  treasure: '📦',
  boss: '👁',
};

interface DungeonMapCanvasProps {
  nodes: MapNode[];
  layers: number;
  loading: boolean;
  onSelectNode: (nodeId: string) => void;
}

export function DungeonMapCanvas({ nodes, layers, loading, onSelectNode }: DungeonMapCanvasProps) {
  const layerIndices = Array.from({ length: layers }, (_, i) => i);

  const nodePositions = new Map<string, { x: number; y: number }>();
  layerIndices.forEach((layer) => {
    const layerNodes = nodes.filter((n) => n.layer === layer);
    layerNodes.forEach((node, idx) => {
      const x = layerNodes.length === 1 ? 50 : 12 + (idx / (layerNodes.length - 1 || 1)) * 76;
      const y = 8 + (layer / Math.max(layers - 1, 1)) * 84;
      nodePositions.set(node.id, { x, y });
    });
  });

  const connections: Array<{ from: string; to: string }> = [];
  nodes.forEach((node) => {
    node.connections.forEach((toId) => {
      connections.push({ from: node.id, to: toId });
    });
  });

  return (
    <div className="dungeon-map-canvas">
      <svg className="map-connections" viewBox="0 0 100 100" preserveAspectRatio="none">
        {connections.map(({ from, to }) => {
          const a = nodePositions.get(from);
          const b = nodePositions.get(to);
          if (!a || !b) return null;
          const fromNode = nodes.find((n) => n.id === from);
          const active = fromNode?.visited || fromNode?.available;
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={`map-connection ${active ? 'active' : ''}`}
            />
          );
        })}
      </svg>

      <div className="map-layers-stack">
        {layerIndices.map((layer) => {
          const layerNodes = nodes.filter((n) => n.layer === layer);
          return (
            <div key={layer} className="map-layer-row">
              <span className="layer-label">L{layer + 1}</span>
              <div className="layer-nodes-row">
                {layerNodes.map((node) => {
                  const canClick = node.available && !node.visited && !loading;
                  const stateClass = node.visited
                    ? 'visited'
                    : node.available
                      ? 'available'
                      : 'locked';
                  return (
                    <button
                      key={node.id}
                      type="button"
                      className={`map-node map-node--stage ${stateClass} type-${node.type}`}
                      disabled={!canClick}
                      onClick={() => onSelectNode(node.id)}
                      title={NODE_TYPE_LABELS[node.type]}
                    >
                      <span className="node-icon">{NODE_ICONS[node.type] ?? '?'}</span>
                      <span className="node-label">{NODE_TYPE_LABELS[node.type]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
