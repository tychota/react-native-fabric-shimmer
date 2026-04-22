import { describe, it, expect } from "vitest";
import { shimmerStyle } from "../../../src/animation/shimmerStyle";

describe("shimmerStyle", () => {
  it("returns opacity 0 for zero-width rects", () => {
    expect(shimmerStyle({ x: 0, width: 0 }, 0)).toMatchObject({ opacity: 0 });
  });

  it("returns a bar width proportional to rect width", () => {
    const s = shimmerStyle({ x: 0, width: 100 }, 0);
    expect(s.width).toBe(40);
  });

  it("produces a translateX that advances with progress", () => {
    const a = shimmerStyle({ x: 0, width: 100 }, 0);
    const b = shimmerStyle({ x: 0, width: 100 }, 0.5);
    expect((b.transform[0]?.translateX ?? 0) > (a.transform[0]?.translateX ?? 0)).toBe(true);
  });
});
