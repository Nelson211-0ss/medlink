import { useEffect, useState } from 'react';

/** Eased count-up animation; starts when `active` becomes true. */
export function useCountUp(
  end: number,
  { duration = 1600, active = true, decimals = 0 }: { duration?: number; active?: boolean; decimals?: number } = {},
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = eased * end;
      setValue(decimals > 0 ? parseFloat(next.toFixed(decimals)) : Math.floor(next));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, duration, active, decimals]);

  return value;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`;
  return String(n);
}
