import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SaveSlotSummary } from '@rcb/shared';
import { abandonRun, deleteSave, fetchRun, fetchSaveSlots } from '../api/gameApi';
import { useGame } from '../context/GameContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

const PHASE_LABEL: Record<string, string> = {
  map: '地图',
  combat: '战斗中',
  boss: 'Boss战',
  reward: '选奖励',
  shop: '商店',
  rest: '休息',
  event: '事件',
  treasure: '宝箱',
  victory: '已通关',
  defeat: '已失败',
};

export default function ContinueView() {
  const navigate = useNavigate();
  const { persistRun, clearRun } = useGame();
  const [saves, setSaves] = useState<SaveSlotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const list = await fetchSaveSlots();
      setSaves(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleContinue(runId: string) {
    setActionId(runId);
    setError('');
    try {
      const run = await fetchRun(runId);
      persistRun(run);
      navigate('/run');
    } catch (e) {
      setError(String(e));
    } finally {
      setActionId(null);
    }
  }

  async function handleAbandon(runId: string) {
    if (!confirm('放弃本局将按失败结算灵魂，确定吗？')) return;
    setActionId(runId);
    try {
      await abandonRun(runId);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(runId: string) {
    if (!confirm('删除存档文件？此操作不可恢复。')) return;
    setActionId(runId);
    try {
      await deleteSave(runId);
      clearRun();
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setActionId(null);
    }
  }

  const continuable = saves.filter((s) => s.continuable);

  return (
    <div className="page continue-view">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          ← 返回主菜单
        </button>
        <h1>继续存档</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <LoadingOverlay label="读取存档…" />
      ) : continuable.length === 0 ? (
        <div className="empty-state">
          <p>没有进行中的存档</p>
          <button className="btn btn-primary" onClick={() => navigate('/class-select')}>
            开始新探索
          </button>
        </div>
      ) : (
        <div className="save-slot-grid">
          {continuable.map((slot) => (
            <article key={slot.runId} className="save-slot-card">
              <header>
                <h3>{slot.className ?? slot.classId}</h3>
                <span className="phase-badge">{PHASE_LABEL[slot.phase] ?? slot.phase}</span>
              </header>
              <ul className="save-slot-stats">
                <li>Seed: <code>{slot.seed}</code></li>
                <li>
                  生命 {slot.currentHp}/{slot.maxHp} · 金币 {slot.gold}
                </li>
                <li>
                  卡组 {slot.deckSize} · 遗物 {slot.relicCount} · 第 {slot.floor} 层
                </li>
                <li className="sub">更新 {new Date(slot.updatedAt).toLocaleString()}</li>
              </ul>
              <div className="save-slot-actions">
                <button
                  className="btn btn-primary"
                  disabled={!!actionId}
                  onClick={() => handleContinue(slot.runId)}
                >
                  继续
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={!!actionId}
                  onClick={() => handleAbandon(slot.runId)}
                >
                  放弃
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={!!actionId}
                  onClick={() => handleDelete(slot.runId)}
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {saves.filter((s) => !s.continuable).length > 0 && (
        <section className="finished-saves">
          <h2>已结束记录</h2>
          <ul>
            {saves
              .filter((s) => !s.continuable)
              .slice(0, 5)
              .map((s) => (
                <li key={s.runId}>
                  {s.className ?? s.classId} · {PHASE_LABEL[s.phase]} · {s.seed}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(s.runId)}
                    disabled={!!actionId}
                  >
                    删除
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
