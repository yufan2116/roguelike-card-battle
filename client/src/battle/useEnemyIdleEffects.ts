import { useEffect, useState } from 'react';

/** 怪物待机：呼吸 + 轻微摇摆 + 随机眨眼（3~8 秒） */
export function useEnemyIdleEffects(isBoss: boolean) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let blinkTimeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const scheduleBlink = () => {
      const wait = 3000 + Math.random() * 5000;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        blinkTimeoutId = setTimeout(() => {
          if (!cancelled) setBlink(false);
          scheduleBlink();
        }, 120);
      }, wait);
    };

    scheduleBlink();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearTimeout(blinkTimeoutId);
    };
  }, []);

  return { blink, isBoss };
}
