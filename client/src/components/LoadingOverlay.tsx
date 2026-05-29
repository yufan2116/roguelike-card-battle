export function LoadingOverlay({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <span>{label}</span>
    </div>
  );
}
