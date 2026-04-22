// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useShimmerProgress } from "../../src/animation/useShimmerProgress";

describe("useShimmerProgress", () => {
  it("returns a SharedValue with numeric value when active", () => {
    const { result } = renderHook(() => useShimmerProgress(true, "shimmer"));
    expect(typeof result.current.value).toBe("number");
  });

  it('returns a SharedValue when animation is "none" (still a value, just 0)', () => {
    const { result } = renderHook(() => useShimmerProgress(true, "none"));
    expect(result.current.value).toBe(0);
  });

  it("returns a SharedValue when inactive", () => {
    const { result } = renderHook(() => useShimmerProgress(false, "shimmer"));
    expect(typeof result.current.value).toBe("number");
  });
});
