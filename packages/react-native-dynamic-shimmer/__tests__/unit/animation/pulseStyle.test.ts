import { describe, it, expect } from "vitest";
import { pulseStyle } from "../../../src/animation/pulseStyle";

describe("pulseStyle", () => {
  it("returns opacity 1 at progress 0", () => {
    expect(pulseStyle(0).opacity).toBeCloseTo(1, 2);
  });
  it("returns opacity 0.5 at progress 0.5", () => {
    expect(pulseStyle(0.5).opacity).toBeCloseTo(0.5, 2);
  });
  it("returns opacity 1 at progress 1 (full cycle wrap)", () => {
    expect(pulseStyle(1).opacity).toBeCloseTo(1, 2);
  });
});
