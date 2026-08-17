import { useEffect, useRef, useState } from 'react';
import { subscribe } from './scheduler';
import { MOTION } from './tokens';
import { useReducedMotion } from './useReducedMotion';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(
  target: number,
  options?: { duration?: number; from?: number; enabled?: boolean },
): number {
  const duration = options?.duration ?? MOTION.count;
  const from = options?.from ?? 0;
  const enabled = options?.enabled ?? true;
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced || !enabled ? target : from);
  const targetRef = useRef(target);
  const fromRef = useRef(from);

  useEffect(() => {
    targetRef.current = target;
    if (reduced || !enabled) {
      setValue(target);
      return;
    }

    const startValue = fromRef.current;
    fromRef.current = target;
    const startTime = performance.now();
    let settled = false;

    const unsub = subscribe((now) => {
      if (settled) return;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const next = startValue + (targetRef.current - startValue) * easeOutCubic(t);
      setValue(next);
      if (t >= 1) {
        settled = true;
        setValue(targetRef.current);
        unsub();
      }
    });

    return unsub;
  }, [target, duration, reduced, enabled]);

  return value;
}
