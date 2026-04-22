import { useEffect, useRef, useState } from "react";

export function useStickyBoolean(value: boolean, minDurationMs: number): boolean {
  const [sticky, setSticky] = useState(value);
  const shownAtRef = useRef<number | null>(value ? Date.now() : null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (value) {
      if (!sticky) {
        setSticky(true);
        shownAtRef.current = Date.now();
      }
      return;
    }
    if (!sticky) return;
    const elapsed = shownAtRef.current === null ? minDurationMs : Date.now() - shownAtRef.current;
    const remaining = Math.max(0, minDurationMs - elapsed);
    if (remaining === 0) {
      setSticky(false);
      shownAtRef.current = null;
      return;
    }
    timerRef.current = setTimeout(() => {
      setSticky(false);
      shownAtRef.current = null;
      timerRef.current = null;
    }, remaining);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, sticky, minDurationMs]);

  return sticky;
}
