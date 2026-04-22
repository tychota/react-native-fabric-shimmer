// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStickyBoolean } from "../../src/visibility/useStickyBoolean";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useStickyBoolean", () => {
  it("returns the initial value on first render", () => {
    const { result } = renderHook(() => useStickyBoolean(false, 500));
    expect(result.current).toBe(false);
  });

  it("passes through a false→false change immediately", () => {
    const { result, rerender } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: false },
    });
    rerender({ v: false });
    expect(result.current).toBe(false);
  });

  it("passes through a false→true change immediately", () => {
    const { result, rerender } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: false },
    });
    act(() => rerender({ v: true }));
    expect(result.current).toBe(true);
  });

  it("holds true for at least minDurationMs after going true→false", () => {
    const { result, rerender } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: false },
    });
    act(() => rerender({ v: true }));
    expect(result.current).toBe(true);
    act(() => rerender({ v: false }));
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current).toBe(false);
  });

  it("initial true starts the sticky period at mount", () => {
    const { result, rerender } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: true },
    });
    act(() => rerender({ v: false }));
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current).toBe(false);
  });

  it("cancels timer on unmount", () => {
    const {
      result: _r,
      rerender,
      unmount,
    } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: false },
    });
    act(() => rerender({ v: true }));
    act(() => rerender({ v: false }));
    unmount();
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });
});
