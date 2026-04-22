import { describe, expect, it } from "vitest";
import { union } from "../../../src/ir/union";

describe("union", () => {
  it("returns null for empty input", () => {
    expect(union([])).toBeNull();
  });

  it("returns a single rect unchanged", () => {
    expect(union([{ x: 10, y: 20, width: 30, height: 40 }])).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });

  it("computes bounding rect of overlapping rects", () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 10, y: 10, width: 20, height: 20 };
    expect(union([a, b])).toEqual({ x: 0, y: 0, width: 30, height: 30 });
  });

  it("computes bounding rect of disjoint rects", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 100, y: 200, width: 10, height: 10 };
    expect(union([a, b])).toEqual({ x: 0, y: 0, width: 110, height: 210 });
  });
});
