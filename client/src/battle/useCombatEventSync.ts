import { useEffect, useRef } from 'react';
import type { CombatState } from '@rcb/shared';
import { extractBattleEvents } from '@rcb/shared';
import { useBattleEvents } from './BattleEventContext';

/** 监听 combat 状态变化，从日志/差异提取事件并派发到表现层 */
export function useCombatEventSync(combat: CombatState | null | undefined) {
  const { emit } = useBattleEvents();
  const prevCombatRef = useRef<CombatState | null>(null);
  const prevLogLenRef = useRef(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!combat) {
      prevCombatRef.current = null;
      prevLogLenRef.current = 0;
      initializedRef.current = false;
      return;
    }

    if (!initializedRef.current) {
      prevCombatRef.current = combat;
      prevLogLenRef.current = combat.log.length;
      initializedRef.current = true;
      return;
    }

    const events = extractBattleEvents(
      prevCombatRef.current,
      combat,
      prevLogLenRef.current
    );

    if (events.length > 0) {
      emit(events);
    }

    prevCombatRef.current = combat;
    prevLogLenRef.current = combat.log.length;
  }, [combat, emit]);
}
