import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GeneratedClassDraft, GeneratedClassPackInput } from '@rcb/shared';
import {
  approveDraft,
  deleteDraft,
  fetchDrafts,
  fetchLlmStatus,
  generateClassPack,
  getPackFromDraft,
  revalidateDraft,
} from '../api/llmApi';

export default function ContentForge() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<{ hasApiKey: boolean; model: string } | null>(null);
  const [drafts, setDrafts] = useState<GeneratedClassDraft[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theme, setTheme] = useState('镜影盗忆者');
  const [nameHint, setNameHint] = useState('');
  const [classIdPrefix, setClassIdPrefix] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [cardCount, setCardCount] = useState(22);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    const [s, d] = await Promise.all([fetchLlmStatus(), fetchDrafts()]);
    setStatus(s);
    setDrafts(d);
    if (!selectedId && d[0]) setSelectedId(d[0].id);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  const selected = drafts.find((d) => d.id === selectedId) ?? null;
  const pack = selected ? (getPackFromDraft(selected) as GeneratedClassPackInput | null) : null;

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await generateClassPack({
        theme: theme.trim(),
        nameHint: nameHint.trim() || undefined,
        classIdPrefix: classIdPrefix.trim() || undefined,
        cardCount,
        userPrompt: userPrompt.trim() || undefined,
      });
      setMessage(result.message);
      await refresh();
      setSelectedId(result.draft.id);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const result = await approveDraft(selected.id, true);
      setMessage(result.message);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleRevalidate() {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await revalidateDraft(selected.id);
      setMessage(result.draft.validation.overallValid ? '重新校验通过' : '重新校验未通过');
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!selected || !confirm('确定删除此草稿？')) return;
    setLoading(true);
    try {
      await deleteDraft(selected.id);
      setSelectedId(null);
      await refresh();
      setMessage('草稿已删除');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page content-forge">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          ← 返回主菜单
        </button>
        <h1>内容工坊</h1>
        {status && (
          <span className={`api-badge ${status.hasApiKey ? 'ok' : 'warn'}`}>
            {status.hasApiKey ? `LLM: ${status.model}` : '未配置 LLM_API_KEY · 使用模板生成'}
          </span>
        )}
      </header>

      <p className="forge-note">
        文本生成使用 <code>LLM_API_KEY</code>，图片生成使用独立的 <code>IMAGE_API_KEY</code>（见 .env）。
      </p>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <section className="forge-generate-panel">
        <h2>生成新职业 + 卡池</h2>
        <div className="forge-form-grid">
          <label>
            流派主题 *
            <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="例如：镜影盗忆、时空残响…" />
          </label>
          <label>
            职业名提示
            <input value={nameHint} onChange={(e) => setNameHint(e.target.value)} placeholder="可选" />
          </label>
          <label>
            ID 前缀
            <input
              value={classIdPrefix}
              onChange={(e) => setClassIdPrefix(e.target.value)}
              placeholder="snake_case，如 mirror_thief"
            />
          </label>
          <label>
            卡牌数量
            <input
              type="number"
              min={20}
              max={30}
              value={cardCount}
              onChange={(e) => setCardCount(parseInt(e.target.value, 10) || 22)}
            />
          </label>
        </div>
        <label className="forge-full-width">
          额外设计说明
          <textarea
            rows={3}
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="例如：偏控制、多抽牌、低血量高爆发…"
          />
        </label>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !theme.trim()}>
          {loading ? '生成中…' : '调用 LLM 生成'}
        </button>
      </section>

      <div className="forge-layout">
        <aside className="forge-draft-list">
          <h3>草稿列表</h3>
          {drafts.length === 0 && <p className="empty-hint">暂无草稿</p>}
          <ul>
            {drafts.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className={selectedId === d.id ? 'active' : ''}
                  onClick={() => setSelectedId(d.id)}
                >
                  <strong>{d.theme}</strong>
                  <span className={`status-tag status-${d.status}`}>{d.status}</span>
                  {d.usedFallback && <span className="sub">模板</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="forge-detail">
          {selected ? (
            <>
              <header className="forge-detail-header">
                <h2>{pack?.class.name ?? selected.theme}</h2>
                <span className={`status-tag status-${selected.status}`}>{selected.status}</span>
              </header>

              <ValidationReport validation={selected.validation} />

              {pack && (
                <>
                  <div className="forge-class-summary">
                    <p>{pack.class.description}</p>
                    <div className="forge-stats">
                      <span>HP {pack.class.maxHp}</span>
                      <span>{pack.cards.length} 张卡</span>
                      <span>ID: {pack.class.id}</span>
                    </div>
                  </div>

                  <div className="forge-card-preview">
                    <h3>卡牌预览（前 8 张）</h3>
                    <div className="card-preview-grid">
                      {pack.cards.slice(0, 8).map((c) => (
                        <div key={c.id} className={`preview-card type-${c.type}`}>
                          <span className="card-cost">{c.cost}</span>
                          <strong>{c.name}</strong>
                          <p>{c.description}</p>
                          <span className="card-rarity">{c.rarity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="forge-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleApprove}
                  disabled={loading || selected.status !== 'validated'}
                >
                  批准并写入游戏
                </button>
                <button className="btn btn-secondary" onClick={handleRevalidate} disabled={loading}>
                  重新校验
                </button>
                <button className="btn btn-ghost" onClick={handleDelete} disabled={loading}>
                  删除草稿
                </button>
              </div>
            </>
          ) : (
            <p className="empty-hint">选择或生成一个草稿</p>
          )}
        </main>
      </div>
    </div>
  );
}

function ValidationReport({
  validation,
}: {
  validation: GeneratedClassDraft['validation'];
}) {
  return (
    <div className={`validation-report ${validation.overallValid ? 'valid' : 'invalid'}`}>
      <h3>校验报告</h3>
      <ul>
        <li>{validation.schemaValid ? '✓' : '✗'} JSON Schema</li>
        <li>{validation.cardBudgetIssues.length === 0 ? '✓' : '✗'} Power Budget（{validation.cardBudgetIssues.length} 问题）</li>
        <li>{validation.starterDeckValid ? '✓' : '✗'} 初始卡组</li>
        <li>{validation.relicRefsValid ? '✓' : '✗'} 遗物引用</li>
        <li>{validation.duplicateCardIds.length === 0 ? '✓' : '✗'} ID 唯一性</li>
        {validation.simulation && (
          <li>
            {validation.simulation.passed ? '✓' : '✗'} 战斗模拟：胜率{' '}
            {(validation.simulation.winRate * 100).toFixed(0)}% vs {validation.simulation.enemyName}
            （{validation.simulation.wins}/{validation.simulation.runs} 胜）
          </li>
        )}
      </ul>
      {validation.schemaErrors.length > 0 && (
        <details>
          <summary>Schema 错误</summary>
          <pre>{validation.schemaErrors.join('\n')}</pre>
        </details>
      )}
      {validation.cardBudgetIssues.length > 0 && (
        <details open>
          <summary>预算问题</summary>
          <ul>
            {validation.cardBudgetIssues.map((i) => (
              <li key={i.cardId}>
                {i.cardName}: 计算 {i.calculated.toFixed(1)} / 上限 {i.limit}（声明 {i.declared}）
              </li>
            ))}
          </ul>
        </details>
      )}
      {validation.warnings.length > 0 && (
        <details>
          <summary>警告</summary>
          <ul>
            {validation.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
