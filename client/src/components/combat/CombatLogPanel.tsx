import { useState } from 'react';
import type { CombatLogEntry } from '@rcb/shared';

interface CombatLogPanelProps {
  log: CombatLogEntry[];
  compactCount?: number;
}

export function CombatLogPanel({ log, compactCount = 3 }: CombatLogPanelProps) {
  const [open, setOpen] = useState(false);
  const recent = log.slice(-compactCount).reverse();

  return (
    <>
      <div className="combat-log-compact">
        <h4 className="combat-log-compact__title">战斗记录</h4>
        <ul className="combat-log-compact__feed">
          {recent.length === 0 ? (
            <li className="log-entry log-system">等待行动…</li>
          ) : (
            recent.map((entry, i) => (
              <li key={`${entry.turn}-${log.length - i}`} className={`log-entry log-${entry.actor}`}>
                <span className="log-turn">T{entry.turn}</span>
                {entry.message}
              </li>
            ))
          )}
        </ul>
        <button type="button" className="combat-log-compact__full-btn" onClick={() => setOpen(true)}>
          查看完整日志
        </button>
      </div>

      {open && (
        <div className="combat-log-drawer-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <aside className="combat-log-drawer" onClick={(e) => e.stopPropagation()}>
            <header className="combat-log-drawer__header">
              <h3>完整战斗日志</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                关闭
              </button>
            </header>
            <div className="combat-log-drawer__scroll">
              {log.map((entry, i) => (
                <div key={i} className={`log-entry log-${entry.actor}`}>
                  <span className="log-turn">T{entry.turn}</span>
                  {entry.message}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
