// Vitest setup. Node environment for unit tests; component tests override
// via `// @vitest-environment jsdom`.

// __DEV__ is already declared by @types/react-native as a global `const`.
// Cast through unknown to override it at runtime in tests.
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;

import { vi } from "vitest";

// Minimal inline mock for react-native-reanimated. The package's shipped
// /mock entrypoint includes JSX which Vitest's transformer rejects. We only
// need useSharedValue, withTiming, withRepeat, cancelAnimation, Easing,
// ReduceMotion for the library's hook tests.
vi.mock("react-native-reanimated", () => {
  type SV<T> = {
    value: T;
    set: (v: T) => void;
    get: () => T;
  };
  const sharedValues = new WeakSet();

  const useSharedValue = <T>(initial: T): SV<T> => {
    const sv: SV<T> = {
      value: initial,
      set(v: T) {
        this.value = v;
      },
      get() {
        return this.value;
      },
    };
    sharedValues.add(sv as unknown as object);
    return sv;
  };

  const withTiming = <T>(target: T, _config?: unknown, cb?: (finished: boolean) => void): T => {
    if (cb !== undefined) cb(true);
    return target;
  };

  const withRepeat = <T>(value: T, _count?: number, _reverse?: boolean): T => value;

  const cancelAnimation = (_sv: unknown): void => {};

  const runOnJS =
    <Args extends ReadonlyArray<unknown>>(fn: (...args: Args) => void) =>
    (...args: Args) =>
      fn(...args);

  const useAnimatedStyle = <T>(fn: () => T): T => fn();

  const Easing = {
    linear: (v: number) => v,
    ease: (v: number) => v,
    in: (fn: (v: number) => number) => fn,
    out: (fn: (v: number) => number) => fn,
    quad: (v: number) => v * v,
    inOut: (fn: (v: number) => number) => fn,
  };

  const ReduceMotion = { System: "system", Always: "always", Never: "never" };

  const interpolate = (value: number, input: number[], output: number[]): number => {
    if (input.length < 2 || output.length < 2) return output[0] ?? 0;
    for (let i = 0; i < input.length - 1; i++) {
      const lo = input[i]!;
      const hi = input[i + 1]!;
      if (value >= lo && value <= hi) {
        const t = (value - lo) / (hi - lo);
        return (output[i] ?? 0) + t * ((output[i + 1] ?? 0) - (output[i] ?? 0));
      }
    }
    return value < input[0]! ? output[0]! : output[output.length - 1]!;
  };

  return {
    useSharedValue,
    withTiming,
    withRepeat,
    cancelAnimation,
    runOnJS,
    useAnimatedStyle,
    Easing,
    ReduceMotion,
    interpolate,
    default: {},
  };
});
