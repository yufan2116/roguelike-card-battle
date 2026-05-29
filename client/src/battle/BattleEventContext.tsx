import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { BattleEvent, BattleEventWithId } from '@rcb/shared';
import { attachEventIds, createEventId } from '@rcb/shared';

export type CombatantAnimState = 'idle' | 'hit' | 'windup' | 'attack' | 'phase_change';
export type ScreenFlash = 'none' | 'red' | 'boss';

export interface FloatingTextItem {
  id: string;
  targetId: 'player' | 'enemy_0';
  text: string;
  variant: 'damage' | 'block' | 'heal' | 'status';
}

export interface FlyingCardItem {
  id: string;
  cardName: string;
  handIndex?: number;
}

export interface BattlePresentationState {
  enemyAnim: CombatantAnimState;
  playerAnim: CombatantAnimState;
  enemyBlink: boolean;
  screenFlash: ScreenFlash;
  bossPhaseBanner: string | null;
  floatingTexts: FloatingTextItem[];
  flyingCards: FlyingCardItem[];
}

const defaultPresentation: BattlePresentationState = {
  enemyAnim: 'idle',
  playerAnim: 'idle',
  enemyBlink: false,
  screenFlash: 'none',
  bossPhaseBanner: null,
  floatingTexts: [],
  flyingCards: [],
};

interface BattleEventContextValue {
  presentation: BattlePresentationState;
  emit: (events: BattleEvent[]) => void;
  emitOne: (event: BattleEvent) => void;
  removeFloatingText: (id: string) => void;
  removeFlyingCard: (id: string) => void;
  clearScreenFlash: () => void;
  clearBossBanner: () => void;
  resetEnemyAnim: () => void;
  resetPlayerAnim: () => void;
}

const BattleEventContext = createContext<BattleEventContextValue | null>(null);

export function BattleEventProvider({ children }: { children: ReactNode }) {
  const [presentation, setPresentation] = useState<BattlePresentationState>(defaultPresentation);
  const queueRef = useRef<BattleEventWithId[]>([]);
  const processingRef = useRef(false);

  const removeFloatingText = useCallback((id: string) => {
    setPresentation((p) => ({
      ...p,
      floatingTexts: p.floatingTexts.filter((t) => t.id !== id),
    }));
  }, []);

  const removeFlyingCard = useCallback((id: string) => {
    setPresentation((p) => ({
      ...p,
      flyingCards: p.flyingCards.filter((c) => c.id !== id),
    }));
  }, []);

  const clearScreenFlash = useCallback(() => {
    setPresentation((p) => ({ ...p, screenFlash: 'none' }));
  }, []);

  const clearBossBanner = useCallback(() => {
    setPresentation((p) => ({ ...p, bossPhaseBanner: null }));
  }, []);

  const resetEnemyAnim = useCallback(() => {
    setPresentation((p) => ({ ...p, enemyAnim: 'idle' }));
  }, []);

  const resetPlayerAnim = useCallback(() => {
    setPresentation((p) => ({ ...p, playerAnim: 'idle' }));
  }, []);

  const processEvent = useCallback(async (event: BattleEventWithId) => {
    switch (event.type) {
      case 'damage': {
        const isPlayer = event.targetId === 'player';
        setPresentation((p) => ({
          ...p,
          [isPlayer ? 'playerAnim' : 'enemyAnim']: 'hit',
          floatingTexts: [
            ...p.floatingTexts,
            {
              id: event.id,
              targetId: event.targetId,
              text: `-${event.amount}`,
              variant: 'damage',
            },
          ],
        }));
        await delay(isPlayer ? 450 : 550);
        setPresentation((p) => ({
          ...p,
          [isPlayer ? 'playerAnim' : 'enemyAnim']: 'idle',
        }));
        break;
      }
      case 'block':
        setPresentation((p) => ({
          ...p,
          floatingTexts: [
            ...p.floatingTexts,
            {
              id: event.id,
              targetId: event.targetId,
              text: `+${event.amount}`,
              variant: 'block',
            },
          ],
        }));
        await delay(700);
        break;
      case 'heal':
        setPresentation((p) => ({
          ...p,
          floatingTexts: [
            ...p.floatingTexts,
            {
              id: event.id,
              targetId: event.targetId,
              text: `+${event.amount}`,
              variant: 'heal',
            },
          ],
        }));
        await delay(700);
        break;
      case 'card_play':
      case 'card_fly':
        if (event.type === 'card_fly') {
          setPresentation((p) => ({
            ...p,
            flyingCards: [
              ...p.flyingCards,
              {
                id: event.id,
                cardName: event.cardName,
                handIndex: event.handIndex,
              },
            ],
          }));
          await delay(500);
        }
        break;
      case 'enemy_attack':
        setPresentation((p) => ({ ...p, enemyAnim: 'windup' }));
        await delay(300);
        setPresentation((p) => ({ ...p, enemyAnim: 'attack' }));
        await delay(250);
        setPresentation((p) => ({ ...p, enemyAnim: 'idle' }));
        break;
      case 'boss_phase_change':
        setPresentation((p) => ({
          ...p,
          enemyAnim: 'phase_change',
          screenFlash: 'red',
          bossPhaseBanner: `${event.bossName} — 第 ${event.phase} 阶段!`,
        }));
        await delay(1200);
        setPresentation((p) => ({
          ...p,
          enemyAnim: 'idle',
          screenFlash: 'none',
        }));
        await delay(800);
        setPresentation((p) => ({ ...p, bossPhaseBanner: null }));
        break;
      case 'shake':
        // handled by hit anim on damage
        break;
      case 'draw':
      case 'turn_start':
      case 'status':
      case 'victory':
        break;
      default:
        break;
    }
  }, []);

  const drainQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    while (queueRef.current.length > 0) {
      const event = queueRef.current.shift()!;
      await processEvent(event);
      await delay(80);
    }
    processingRef.current = false;
  }, [processEvent]);

  const emit = useCallback(
    (events: BattleEvent[]) => {
      const withIds = attachEventIds(events);
      queueRef.current.push(...withIds);
      void drainQueue();
    },
    [drainQueue]
  );

  const emitOne = useCallback(
    (event: BattleEvent) => {
      emit([event]);
    },
    [emit]
  );

  return (
    <BattleEventContext.Provider
      value={{
        presentation,
        emit,
        emitOne,
        removeFloatingText,
        removeFlyingCard,
        clearScreenFlash,
        clearBossBanner,
        resetEnemyAnim,
        resetPlayerAnim,
      }}
    >
      {children}
    </BattleEventContext.Provider>
  );
}

export function useBattleEvents() {
  const ctx = useContext(BattleEventContext);
  if (!ctx) throw new Error('useBattleEvents must be used within BattleEventProvider');
  return ctx;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 乐观出牌：点击瞬间触发 card_fly */
export function createOptimisticCardFly(cardName: string, handIndex: number): BattleEventWithId {
  return {
    type: 'card_fly',
    sourceId: 'player',
    targetId: 'enemy_0',
    cardName,
    handIndex,
    id: createEventId(),
  };
}
