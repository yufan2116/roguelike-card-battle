import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MetaProgress } from '@rcb/shared';
import { fetchMeta } from '../api/gameApi';

interface MetaContextValue {
  meta: MetaProgress | null;
  loading: boolean;
  refreshMeta: () => Promise<void>;
  setMeta: (meta: MetaProgress) => void;
}

const MetaContext = createContext<MetaContextValue | null>(null);

export function MetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<MetaProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMeta = useCallback(async () => {
    const data = await fetchMeta();
    setMeta(data);
  }, []);

  useEffect(() => {
    refreshMeta()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshMeta]);

  return (
    <MetaContext.Provider value={{ meta, loading, refreshMeta, setMeta }}>
      {children}
    </MetaContext.Provider>
  );
}

export function useMeta() {
  const ctx = useContext(MetaContext);
  if (!ctx) throw new Error('useMeta must be used within MetaProvider');
  return ctx;
}
