import { describe, expect, it } from "vitest";
import { typeName } from "../../../src/fiber/typeName";

describe("typeName", () => {
  it("returns host strings as-is", () => {
    expect(typeName({ type: "RCTText" } as never)).toBe("RCTText");
    expect(typeName({ type: "View" } as never)).toBe("View");
  });

  it("returns function component displayName", () => {
    const Comp = Object.assign(() => null, { displayName: "UserCard" });
    expect(typeName({ type: Comp } as never)).toBe("UserCard");
  });

  it("returns function component name when displayName absent", () => {
    function MyBadge() {
      return null;
    }
    expect(typeName({ type: MyBadge } as never)).toBe("MyBadge");
  });

  it('returns "Component" for anonymous functions', () => {
    expect(typeName({ type: () => null } as never)).toBe("Component");
  });

  it('returns "Unknown" for null type', () => {
    expect(typeName({ type: null } as never)).toBe("Unknown");
  });
});
