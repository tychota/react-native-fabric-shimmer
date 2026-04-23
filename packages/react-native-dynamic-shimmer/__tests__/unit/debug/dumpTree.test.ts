import { describe, it, expect } from "vitest";
import { dumpTree } from "../../../src/debug/dumpTree";
import type { BoneNode } from "../../../src/types";

describe("dumpTree", () => {
  it("renders a single node with type, classification, and rect", () => {
    const tree: BoneNode = {
      id: "root",
      type: "RCTView",
      classification: "container",
      rect: { x: 0, y: 0, width: 370, height: 118 },
      style: {},
      children: [],
    };
    expect(dumpTree(tree)).toBe("RCTView [container] (0,0 370×118)");
  });

  it("indents children two spaces per depth level", () => {
    const tree: BoneNode = {
      id: "root",
      type: "RCTView",
      classification: "transparent",
      rect: { x: 0, y: 0, width: 0, height: 0 },
      style: {},
      children: [
        {
          id: "a",
          type: "RCTText",
          classification: "leaf",
          rect: { x: 10, y: 20, width: 80, height: 16 },
          style: {},
          children: [],
        },
        {
          id: "b",
          type: "RCTView",
          classification: "container",
          rect: { x: 0, y: 40, width: 100, height: 50 },
          style: {},
          children: [
            {
              id: "c",
              type: "RCTImage",
              classification: "leaf",
              rect: { x: 5, y: 45, width: 24, height: 24 },
              style: {},
              children: [],
            },
          ],
        },
      ],
    };
    expect(dumpTree(tree)).toBe(
      [
        "RCTView [transparent] (0,0 0×0)",
        "  RCTText [leaf] (10,20 80×16)",
        "  RCTView [container] (0,40 100×50)",
        "    RCTImage [leaf] (5,45 24×24)",
      ].join("\n"),
    );
  });

  it("rounds fractional coordinates to whole pixels", () => {
    const tree: BoneNode = {
      id: "root",
      type: "RCTText",
      classification: "leaf",
      rect: { x: 10.7, y: 20.2, width: 80.51, height: 15.9 },
      style: {},
      children: [],
    };
    expect(dumpTree(tree)).toBe("RCTText [leaf] (11,20 81×16)");
  });
});
