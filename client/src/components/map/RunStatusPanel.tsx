import type { RunState } from '@rcb/shared';
import { NODE_TYPE_LABELS } from '@rcb/shared';

interface RunStatusPanelProps {
  run: RunState;
  className?: string;
  classDisplayName?: string;
  availableCount: number;
  loading?: boolean;
  onAbandon?: () => void;
}

export function RunStatusPanel({
  run,
  classDisplayName,
  availableCount,
  loading,
  onAbandon,
}: RunStatusPanelProps) {
  const currentNode = run.map.nodes.find((n) => n.available && !n.visited);
  const upgraded = run.player.upgradedCards?.length ?? 0;

  return (
    <aside className="run-status-sidebar">
      <div className="run-status-card">
        <h3>探索状态</h3>

        <dl className="run-stat-grid">
          <div>
            <dt>职业</dt>
            <dd>{classDisplayName ?? run.player.classId}</dd>
          </div>
          <div>
            <dt>生命</dt>
            <dd>
              {run.player.currentHp} / {run.player.maxHp}
            </dd>
          </div>
          <div>
            <dt>金币</dt>
            <dd className="gold">{run.player.gold}</dd>
          </div>
          <div>
            <dt>卡组</dt>
            <dd>{run.player.deck.length} 张</dd>
          </div>
          <div>
            <dt>已升级</dt>
            <dd>{upgraded} 张</dd>
          </div>
          <div>
            <dt>遗物</dt>
            <dd>{run.player.relics.length} 件</dd>
          </div>
        </dl>

        <div className="run-hp-bar">
          <div
            className="run-hp-fill"
            style={{ width: `${(run.player.currentHp / run.player.maxHp) * 100}%` }}
          />
        </div>

        {run.player.relics.length > 0 && (
          <div className="relic-bar">
            {run.player.relics.map((id) => (
              <span key={id} className="relic-chip" title={id}>
                ✦ {id.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        <section className="run-current-node">
          <h4>当前节点</h4>
          {currentNode ? (
            <>
              <p className="node-type-label">{NODE_TYPE_LABELS[currentNode.type]}</p>
              <p className="node-hint">第 {currentNode.layer + 1} 层 · 点击左侧地图进入</p>
            </>
          ) : (
            <p className="node-hint">暂无可选节点</p>
          )}
          <p className="available-count">可选节点：{availableCount}</p>
        </section>

        {onAbandon && (
          <button type="button" className="btn btn-ghost btn-block" onClick={onAbandon} disabled={loading}>
            放弃本局
          </button>
        )}
      </div>
    </aside>
  );
}
