import { describe, expect, it } from "vitest";
import { getFiber } from "../../../src/fiber/getFiber";

describe("getFiber", () => {
  it("returns __internalInstanceHandle when present", () => {
    const fake = { some: "fiber" };
    expect(getFiber({ __internalInstanceHandle: fake } as never)).toBe(fake);
  });

  it("returns null when handle is missing", () => {
    expect(getFiber({} as never)).toBeNull();
    expect(getFiber(null)).toBeNull();
    expect(getFiber(undefined)).toBeNull();
  });
});
