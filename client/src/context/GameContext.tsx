import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { RunState } from '@rcb/shared';
import { LAST_RUN_STORAGE_KEY } from '@rcb/shared';

interface GameContextValue {
  run: RunState | null;
  setRun: (run: RunState | null) => void;
  persistRun: (run: RunState) => void;
  clearRun: () => void;
}

export const GameContext = createContext<GameContextValue>({
  run: null,
  setRun: () => {},
  persistRun: () => {},
  clearRun: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [run, setRunState] = useState<RunState | null>(null);

  const persistRun = useCallback((next: RunState) => {
    setRunState(next);
    localStorage.setItem(LAST_RUN_STORAGE_KEY, next.id);
  }, []);

  const setRun = useCallback(
    (next: RunState | null) => {
      if (next) persistRun(next);
      else setRunState(null);
    },
    [persistRun]
  );

  const clearRun = useCallback(() => {
    setRunState(null);
    localStorage.removeItem(LAST_RUN_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const savedId = localStorage.getItem(LAST_RUN_STORAGE_KEY);
    if (savedId && !run) {
      // 仅恢复 ID，实际加载由 Continue 页或 App 路由处理
    }
  }, [run]);

  return (
    <GameContext.Provider value={{ run, setRun, persistRun, clearRun }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}

export function getStoredRunId(): string | null {
  return localStorage.getItem(LAST_RUN_STORAGE_KEY);
}
