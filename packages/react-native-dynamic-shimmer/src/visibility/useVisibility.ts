import { useEffect, useState } from "react";
import { useStickyBoolean } from "./useStickyBoolean";

// Classic suspense loading pattern: wait `delayShowMs` before flipping
// visibility to true. If `loading` goes false within that window, we never
// flash a skeleton for a request that resolved in a frame or two. Once
// visible, `useStickyBoolean` keeps it on screen for at least
// `minShowDurationMs` to avoid a brief flicker.
export function useVisibility(
  loading: boolean,
  minShowDurationMs: number,
  delayShowMs: number,
): boolean {
  const [delayPassed, setDelayPassed] = useState(false);

  useEffect(() => {
    if (!loading) {
      setDelayPassed(false);
      return;
    }
    if (delayShowMs <= 0) {
      setDelayPassed(true);
      return;
    }
    const id = setTimeout(() => setDelayPassed(true), delayShowMs);
    return () => clearTimeout(id);
  }, [loading, delayShowMs]);

  const shouldShow = loading && delayPassed;
  return useStickyBoolean(shouldShow, minShowDurationMs);
}
