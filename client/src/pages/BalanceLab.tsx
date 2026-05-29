import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClassBalanceReport, GlobalBalanceReport } from '@rcb/shared';
import {
  fetchBalanceScenarios,
  fetchLastBalanceReport,
  runClassAudit,
  runGlobalAudit,
} from '../api/balanceApi';
import { fetchClasses } from '../api/gameApi';

const RATING_LABEL: Record<string, string> = {
  balanced: '平衡',
  too_easy: '过易',
  too_hard: '过难',
  broken: '异常',
};

export default function BalanceLab() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [report, setReport] = useState<GlobalBalanceReport | null>(null);
  const [classReport, setClassReport] = useState<ClassBalanceReport | null>(null);
  const [scenarios, setScenarios] = useState<
    Array<{ id: string; label: string; expectedWinRate: { min: number; max: number } }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([fetchClasses(), fetchBalanceScenarios(), fetchLastBalanceReport()])
      .then(([cls, sc, last]) => {
        setClasses(cls.map((c) => ({ id: c.id, name: c.name })));
        setSelectedClassId(cls[0]?.id ?? '');
        setScenarios(sc);
        if (last) setReport(last);
      })
      .catch((e) => setError(String(e)));
  }, []);

  async function handleGlobalAudit() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await runGlobalAudit(10);
      setReport(result.report);
      setClassReport(null);
      setMessage(`全局审计完成 · 综合分 ${result.report.overallScore} · ${result.report.passed ? '通过' : '需调整'}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleClassAudit() {
    if (!selectedClassId) return;
    setLoading(true);
    setError('');
    try {
      const result = await runClassAudit(selectedClassId, 12);
      setClassReport(result.report);
      setMessage(`${result.report.className} 审计完成 · 得分 ${result.report.overallScore}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const activeClassReport =
    classReport ?? report?.classes.find((c) => c.classId === selectedClassId) ?? null;

  return (
    <div className="page balance-lab">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          ← 返回主菜单
        </button>
        <h1>平衡实验室</h1>
      </header>

      <p className="forge-note">
        自动战斗模拟：多 AI 策略 × 多敌人场景 × Power Budget 审计。结果基于 starter / 全卡池 deck。
      </p>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <section className="balance-actions">
        <button className="btn btn-primary" onClick={handleGlobalAudit} disabled={loading}>
          {loading ? '模拟中…' : '运行全局平衡审计'}
        </button>
        <label>
          单职业审计
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-secondary" onClick={handleClassAudit} disabled={loading || !selectedClassId}>
          审计选中职业
        </button>
      </section>

      {report && (
        <section className="balance-summary">
          <h2>全局概览</h2>
          <div className="balance-score-row">
            <span className={`score-badge ${report.passed ? 'pass' : 'fail'}`}>
              综合分 {report.overallScore}
            </span>
            <span>{report.passed ? '整体通过' : '存在平衡问题'}</span>
            <span className="sub">{new Date(report.generatedAt).toLocaleString()}</span>
          </div>
          {report.suggestions.length > 0 && (
            <ul className="balance-suggestions">
              {report.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeClassReport && (
        <section className="balance-class-detail">
          <h2>
            {activeClassReport.className} · 得分 {activeClassReport.overallScore}
          </h2>

          <h3>战斗模拟矩阵</h3>
          <div className="balance-matrix-wrap">
            <table className="balance-matrix">
              <thead>
                <tr>
                  <th>场景</th>
                  <th>策略</th>
                  <th>胜率</th>
                  <th>期望</th>
                  <th>回合</th>
                  <th>评级</th>
                </tr>
              </thead>
              <tbody>
                {activeClassReport.cells.map((cell) => (
                  <tr key={`${cell.scenarioId}-${cell.strategy}`} className={`rating-${cell.rating}`}>
                    <td>{cell.scenarioLabel}</td>
                    <td>{cell.strategy}</td>
                    <td>{(cell.report.winRate * 100).toFixed(0)}%</td>
                    <td>
                      {(cell.expectedWinRate.min * 100).toFixed(0)}~
                      {(cell.expectedWinRate.max * 100).toFixed(0)}%
                    </td>
                    <td>{cell.report.avgTurns.toFixed(1)}</td>
                    <td>{RATING_LABEL[cell.rating] ?? cell.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>卡牌 Power Budget</h3>
          <div className="balance-matrix-wrap">
            <table className="balance-matrix card-audit-table">
              <thead>
                <tr>
                  <th>卡牌</th>
                  <th>费用</th>
                  <th>计算值</th>
                  <th>上限</th>
                  <th>利用率</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {activeClassReport.cardAudit
                  .sort((a, b) => b.utilization - a.utilization)
                  .slice(0, 15)
                  .map((c) => (
                    <tr key={c.cardId} className={c.valid ? '' : 'invalid-row'}>
                      <td>{c.cardName}</td>
                      <td>{c.cost}</td>
                      <td>{c.calculated.toFixed(1)}</td>
                      <td>{c.limit}</td>
                      <td>{(c.utilization * 100).toFixed(0)}%</td>
                      <td>{c.valid ? '✓' : c.fixAction ?? '超标'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {scenarios.length > 0 && (
        <section className="balance-scenarios-ref">
          <h3>参考场景</h3>
          <ul>
            {scenarios.map((s) => (
              <li key={s.id}>
                {s.label} — 期望胜率 {(s.expectedWinRate.min * 100).toFixed(0)}%~
                {(s.expectedWinRate.max * 100).toFixed(0)}%
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
