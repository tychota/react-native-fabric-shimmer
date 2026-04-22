const BAR_FRACTION = 0.4;
const PHASE_FACTOR = 0.6;

export type ShimmerInput = { readonly x: number; readonly width: number };

export type ShimmerOutput = {
  opacity: number;
  width: number;
  transform: ReadonlyArray<{ translateX: number }>;
};

export function shimmerStyle(rect: ShimmerInput, progress: number): ShimmerOutput {
  "worklet";
  if (rect.width <= 0) return { opacity: 0, width: 0, transform: [{ translateX: 0 }] };
  const barW = rect.width * BAR_FRACTION;
  const phase = rect.x / Math.max(1, rect.width * 4);
  const t = (progress - phase * PHASE_FACTOR + 1) % 1;
  const translateX = -barW + t * (rect.width + barW);
  return { opacity: 1, width: barW, transform: [{ translateX }] };
}
