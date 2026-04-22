import { describe, expect, it } from "vitest";
import type { BoneNode } from "../../../src/types";
import { hide } from "../../../src/ir/hide";

function node(id: string, children: BoneNode[] = []): BoneNode {
  return {
    id,
    type: "View",
    classification: "leaf",
    rect: { x: 0, y: 0, width: 10, height: 10 },
    style: {},
    children,
  };
}

describe("hide", () => {
  it("removes a matching child from the parent children list", () => {
    const b = node("b");
    const tree = node("a", [b, node("c")]);
    const result = hide(tree, b);
    expect(result.children.map((n) => n.id)).toEqual(["c"]);
  });

  it("preserves siblings around the hidden node", () => {
    const mid = node("mid");
    const tree = node("root", [node("l"), mid, node("r")]);
    expect(hide(tree, mid).children.map((n) => n.id)).toEqual(["l", "r"]);
  });

  it("returns the input unchanged when target is not in the tree", () => {
    const tree = node("root", [node("a")]);
    const orphan = node("orphan");
    expect(hide(tree, orphan)).toBe(tree);
  });

  it("does not mutate the input", () => {
    const b = node("b");
    const tree = node("a", [b, node("c")]);
    const beforeChildrenIds = tree.children.map((n) => n.id);
    hide(tree, b);
    expect(tree.children.map((n) => n.id)).toEqual(beforeChildrenIds);
  });
});
