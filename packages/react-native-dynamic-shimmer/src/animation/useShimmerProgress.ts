import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { AnimationKind } from "../types";

const DURATION_MS = 1400;

export function useShimmerProgress(active: boolean, kind: AnimationKind): SharedValue<number> {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active || kind === "none") {
      cancelAnimation(progress);
      progress.set(0);
      return;
    }
    progress.set(0);
    progress.set(
      withRepeat(
        withTiming(1, {
          duration: DURATION_MS,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [active, kind, progress]);

  return progress;
}
