export type PulseOutput = { opacity: number };

export function pulseStyle(progress: number): PulseOutput {
  "worklet";
  const t = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
  const opacity = 1 - 0.5 * t;
  return { opacity };
}
