import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ArtStylePreset, ImageEntityType } from '@rcb/shared';
import {
  fetchEntities,
  generateBatch,
  generateImage,
  resolveEntityImage,
  setActiveVariant,
  setGlobalPreset,
  type EntityLite,
} from '../api/imageApi';
import { getImageUrl } from '../api/gameApi';
import { useImageAssets } from '../context/ImageAssetContext';

const ENTITY_TABS: { type: ImageEntityType; label: string }[] = [
  { type: 'class', label: '职业' },
  { type: 'enemy', label: '怪物' },
  { type: 'boss', label: 'Boss' },
  { type: 'card', label: '卡牌' },
  { type: 'relic', label: '遗物' },
];

export default function ArtStudio() {
  const navigate = useNavigate();
  const { presets, hasApiKey, registry, refresh, loading: ctxLoading } = useImageAssets();

  const [entityType, setEntityType] = useState<ImageEntityType>('class');
  const [entities, setEntities] = useState<EntityLite[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preset, setPreset] = useState<ArtStylePreset>('dark_fairy_tale');
  const [customPrompt, setCustomPrompt] = useState('');
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [batching, setBatching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [recordImagePath, setRecordImagePath] = useState<string | undefined>();
  const [variants, setVariants] = useState<
    Array<{ id: string; preset: ArtStylePreset; imagePath: string; createdAt: string }>
  >([]);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (registry?.globalPreset) setPreset(registry.globalPreset);
  }, [registry?.globalPreset]);

  useEffect(() => {
    fetchEntities(entityType)
      .then((list) => {
        setEntities(list);
        setSelectedId(list[0]?.id ?? null);
      })
      .catch((e) => setError(String(e)));
  }, [entityType]);

  useEffect(() => {
    if (!selectedId) return;
    resolveEntityImage(entityType, selectedId)
      .then((data) => {
        setRecordImagePath(data.imagePath);
        setVariants(data.record?.variants ?? []);
        setActiveVariantId(data.record?.activeVariantId ?? null);
        if (data.entity?.imagePrompt) {
          // 不覆盖用户正在编辑的 customPrompt
        }
      })
      .catch(console.error);
  }, [entityType, selectedId, generating, batching]);

  const selected = entities.find((e) => e.id === selectedId);
  const filtered = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
  );

  async function handleGenerate() {
    if (!selectedId) return;
    setGenerating(true);
    setError('');
    setMessage('');
    try {
      const result = await generateImage({
        entityType,
        entityId: selectedId,
        preset,
        customPrompt: customPrompt.trim() || undefined,
      });
      setMessage(result.message);
      await refresh();
      setRecordImagePath(result.imagePath);
      setVariants(result.record.variants);
      setActiveVariantId(result.variantId);
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function handleBatch() {
    setBatching(true);
    setError('');
    setMessage('');
    try {
      const result = await generateBatch({
        entityType,
        preset,
        customPrompt: customPrompt.trim() || undefined,
        limit: 5,
      });
      const fallbackCount = result.results.filter((r) => r.usedFallback).length;
      setMessage(
        `批量生成 ${result.results.length} 张${fallbackCount ? `（${fallbackCount} 张为 SVG 占位）` : ''}`
      );
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBatching(false);
    }
  }

  async function handleSwitchVariant(variantId: string) {
    if (!selectedId) return;
    try {
      const result = await setActiveVariant(entityType, selectedId, variantId);
      setActiveVariantId(variantId);
      setVariants(result.record.variants);
      const active = result.record.variants.find((v) => v.id === variantId);
      setRecordImagePath(active?.imagePath);
      await refresh();
      setMessage('已切换美术风格');
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleGlobalPreset(p: ArtStylePreset) {
    setPreset(p);
    try {
      await setGlobalPreset(p);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  if (ctxLoading) {
    return <div className="page loading-page">加载美术工坊…</div>;
  }

  return (
    <div className="page art-studio">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          ← 返回主菜单
        </button>
        <h1>美术工坊</h1>
        <span className={`api-badge ${hasApiKey ? 'ok' : 'warn'}`}>
          {hasApiKey ? 'AI 图片 API 已配置' : '未配置 API Key · 将生成本地 SVG 占位图'}
        </span>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <section className="studio-global-preset">
        <span>默认风格（新生成时使用）</span>
        <div className="preset-chips">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`preset-chip ${preset === p.id ? 'active' : ''}`}
              onClick={() => handleGlobalPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <div className="studio-layout">
        <aside className="studio-sidebar">
          <div className="entity-tabs">
            {ENTITY_TABS.map((tab) => (
              <button
                key={tab.type}
                type="button"
                className={entityType === tab.type ? 'active' : ''}
                onClick={() => setEntityType(tab.type)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            className="studio-search"
            placeholder="搜索名称或 ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="entity-list">
            {filtered.map((entity) => (
              <li key={entity.id}>
                <button
                  type="button"
                  className={selectedId === entity.id ? 'active' : ''}
                  onClick={() => setSelectedId(entity.id)}
                >
                  <strong>{entity.name}</strong>
                  {entity.subLabel && <span className="sub">{entity.subLabel}</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="studio-main">
          {selected ? (
            <>
              <div className="preview-panel">
                <img
                  src={getImageUrl(recordImagePath)}
                  alt={selected.name}
                  className="studio-preview"
                />
                <div className="preview-meta">
                  <h2>{selected.name}</h2>
                  <p className="prompt-text">{selected.imagePrompt}</p>
                </div>
              </div>

              <div className="generate-panel">
                <label>
                  风格预设
                  <select
                    value={preset}
                    onChange={(e) => setPreset(e.target.value as ArtStylePreset)}
                  >
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  自定义 Prompt（可选）
                  <textarea
                    rows={3}
                    placeholder="例如：more crimson lighting, scarred armor…"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </label>

                <div className="studio-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    disabled={generating || batching}
                  >
                    {generating ? '生成中…' : '生成图片'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleBatch}
                    disabled={generating || batching}
                  >
                    {batching ? '批量生成中…' : `批量生成前 5 个${ENTITY_TABS.find((t) => t.type === entityType)?.label}`}
                  </button>
                </div>
              </div>

              {variants.length > 0 && (
                <div className="variants-panel">
                  <h3>已保存风格变体 · 点击切换</h3>
                  <div className="variant-grid">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`variant-thumb ${activeVariantId === v.id ? 'active' : ''}`}
                        onClick={() => handleSwitchVariant(v.id)}
                      >
                        <img src={getImageUrl(v.imagePath)} alt={v.preset} />
                        <span>{presets.find((p) => p.id === v.preset)?.label ?? v.preset}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="empty-hint">请选择左侧实体</p>
          )}
        </main>
      </div>
    </div>
  );
}
