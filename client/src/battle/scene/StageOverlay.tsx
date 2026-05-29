/** 舞台暗色遮罩与晕影 — 提升 UI 可读性 */
export function StageOverlay() {
  return (
    <div className="stage-overlay" aria-hidden>
      <div className="stage-overlay__dim" />
      <div className="stage-overlay__vignette" />
    </div>
  );
}
