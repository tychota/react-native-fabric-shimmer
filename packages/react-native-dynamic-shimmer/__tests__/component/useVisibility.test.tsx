// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVisibility } from "../../src/visibility/useVisibility";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useVisibility", () => {
  it("returns false initially when loading is false", () => {
    const { result } = renderHook(() => useVisibility(false, 500, 100));
    expect(result.current).toBe(false);
  });

  it("stays false during the initial delay window (fast load pattern)", () => {
    const { result } = renderHook(() => useVisibility(true, 500, 100));
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe(false);
  });

  it("never flips visible if loading ends within the delay window", () => {
    const { result, rerender } = renderHook(({ l }) => useVisibility(l, 500, 100), {
      initialProps: { l: true },
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => rerender({ l: false }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(false);
  });

  it("flips visible once the delay window passes while still loading", () => {
    const { result } = renderHook(() => useVisibility(true, 500, 100));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe(true);
  });

  it("keeps visible sticky after loading=false once it has been shown", () => {
    const { result, rerender } = renderHook(({ l }) => useVisibility(l, 500, 100), {
      initialProps: { l: true },
    });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe(true);
    act(() => rerender({ l: false }));
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current).toBe(false);
  });

  it("flips visible immediately when delayShowMs is 0", () => {
    const { result } = renderHook(() => useVisibility(true, 500, 0));
    expect(result.current).toBe(true);
  });
});
