import { describe, it, expect } from "vitest";
import { buildBoneTree } from "../../../src/measure/buildBoneTree";
import { View, Text, Image } from "../../helpers/fakeFiber";

// The root fiber is treated as the walk root (measurement origin), never as a
// bone candidate. Classification is applied only to its descendants.
describe("buildBoneTree", () => {
  it("walks children of the root — text becomes a leaf child", () => {
    const fiber = View({}, Text("hi"));
    const { tree } = buildBoneTree(fiber);
    expect(tree.classification).toBe("transparent");
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]!.classification).toBe("leaf");
    expect(tree.children[0]!.type).toBe("RCTText");
  });

  it("the root itself is never classified, even if it looks leaf-like", () => {
    // A bare Text fiber as root has no children — tree still has root as
    // transparent with zero children. The fiber never becomes a bone.
    const fiber = Text("hi");
    const { tree, targets } = buildBoneTree(fiber);
    expect(tree.classification).toBe("transparent");
    expect(tree.children).toHaveLength(0);
    expect(targets.size).toBe(0);
  });

  it("descends transparent wrappers and classifies each child", () => {
    const fiber = View({}, Text("a"), Image());
    const { tree } = buildBoneTree(fiber);
    expect(tree.classification).toBe("transparent");
    expect(tree.children.map((c) => c.type)).toEqual(["RCTText", "RCTImage"]);
    expect(tree.children[0]!.classification).toBe("leaf");
    expect(tree.children[1]!.classification).toBe("leaf");
  });

  it("emits container for child wrappers with surface", () => {
    const fiber = View({}, View({ style: { backgroundColor: "#fff" } }, Text("a")));
    const { tree } = buildBoneTree(fiber);
    expect(tree.classification).toBe("transparent");
    const card = tree.children[0]!;
    expect(card.classification).toBe("container");
    expect(card.children).toHaveLength(1);
    expect(card.children[0]!.type).toBe("RCTText");
  });

  it("skips subtrees classified as skip (e.g. display: none in user content)", () => {
    const fiber = View({}, View({ style: { display: "none" } }, Text("hidden")), Text("visible"));
    const { tree } = buildBoneTree(fiber);
    expect(tree.children.map((c) => c.type)).toEqual(["View", "RCTText"]);
    expect(tree.children[0]!.classification).toBe("transparent"); // placeholder for skip
    expect(tree.children[0]!.children).toHaveLength(0);
  });

  it("skips user content with opacity: 0 — but the root is still descended", () => {
    // This is the crux: the library's own root wrapper may have opacity: 0,
    // but its children still get walked because the root is never classified.
    const fiber = View({ style: { opacity: 0 } }, Text("inside"));
    const { tree, targets } = buildBoneTree(fiber);
    expect(tree.classification).toBe("transparent");
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]!.type).toBe("RCTText");
    expect(tree.children[0]!.classification).toBe("leaf");
    expect(targets.size).toBe(1);
  });

  it("respects a custom classify for descendants", () => {
    const fiber = View({}, Text("a"), Text("b"));
    const { tree } = buildBoneTree(fiber, () => "leaf");
    expect(tree.classification).toBe("transparent");
    expect(tree.children.every((c) => c.classification === "leaf")).toBe(true);
  });
});
