import { describe, it, expect } from "vitest";
import { buildBoneTree } from "../../../src/measure/buildBoneTree";
import { View, Text, Image } from "../../helpers/fakeFiber";

// The root fiber is treated as the walk root (measurement origin), never as a
// bone candidate. Classification is applied only to its descendants.
describe("buildBoneTree", () => {
  it("emits a single leaf for a Text", () => {
    const fiber = Text("hi");
    const tree = buildBoneTree(fiber);
    expect(tree.classification).toBe("leaf");
    expect(tree.type).toBe("RCTText");
    expect(tree.children).toHaveLength(0);
    expect(targets.size).toBe(0);
  });

  it("descends transparent wrappers and classifies each child", () => {
    const fiber = View({}, Text("a"), Image());
    const tree = buildBoneTree(fiber);
    expect(tree.classification).toBe("transparent");
    expect(tree.children.map((c) => c.type)).toEqual(["RCTText", "RCTImage"]);
    expect(tree.children[0]!.classification).toBe("leaf");
    expect(tree.children[1]!.classification).toBe("leaf");
  });

  it("emits container + descends into children", () => {
    const fiber = View({ style: { backgroundColor: "#fff" } }, Text("a"));
    const tree = buildBoneTree(fiber);
    expect(tree.classification).toBe("container");
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]!.type).toBe("RCTText");
  });

  it("skips subtrees classified as skip (e.g. display: none in user content)", () => {
    const fiber = View({}, View({ style: { display: "none" } }, Text("hidden")), Text("visible"));
    const tree = buildBoneTree(fiber);
    expect(tree.children.map((c) => c.type)).toEqual(["View", "RCTText"]);
    expect(tree.children[0]!.classification).toBe("transparent"); // placeholder for skip
    expect(tree.children[0]!.children).toHaveLength(0);
  });

  it("respects a custom classify", () => {
    const fiber = View({}, Text("a"));
    const tree = buildBoneTree(fiber, () => "leaf");
    expect(tree.classification).toBe("leaf");
    expect(tree.children).toHaveLength(0);
  });
});
