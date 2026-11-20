import { useEffect, useRef, useState } from 'react';

/** Counts down from `seconds`; calls onDone once at 0. Restart by changing `key`. */
export function useCountdown(seconds: number, onDone?: () => void, key?: unknown) {
  const [left, setLeft] = useState(seconds);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    setLeft(seconds);
    const started = Date.now();
    const t = setInterval(() => {
      const l = Math.max(0, seconds - Math.floor((Date.now() - started) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(t);
        done.current?.();
      }
    }, 250);
    return () => clearInterval(t);
  }, [seconds, key]);

  return left;
}
