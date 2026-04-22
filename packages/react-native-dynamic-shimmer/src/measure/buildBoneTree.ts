import type { BoneNode, ClassifyFn, FiberNode } from "../types";
import { typeName } from "../fiber/typeName";
import { extractStyle } from "../fiber/extractStyle";
import { defaultClassify } from "../fiber/defaultClassify";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `bone-${idCounter}`;
}

const ZERO_RECT = { x: 0, y: 0, width: 0, height: 0 } as const;

export type BoneTreeResult = {
  tree: BoneNode;
  targets: Map<string, unknown>;
};

// The root fiber is the walk root, not a bone candidate — it's the library's
// own wrapper over the user's content. Always descend into its children.
// Classification (leaf/container/skip) applies only to the subtree, so user
// content like opacity:0 wrappers still gets skipped as intended.
export function buildBoneTree(
  fiber: FiberNode,
  classify: ClassifyFn = defaultClassify,
): BoneTreeResult {
  const targets = new Map<string, unknown>();
  const children: BoneNode[] = [];
  let child = fiber.child;
  while (child !== null) {
    children.push(walk(child, classify, targets));
    child = child.sibling;
  }
  return {
    tree: {
      id: nextId(),
      type: typeName(fiber),
      classification: "transparent",
      rect: ZERO_RECT,
      style: extractStyle(fiber),
      children,
    },
    targets,
  };
}

function walk(fiber: FiberNode, classify: ClassifyFn, targets: Map<string, unknown>): BoneNode {
  const cls = safeClassify(fiber, classify);
  const id = nextId();
  const type = typeName(fiber);
  const style = extractStyle(fiber);

  if (cls === "skip") {
    return {
      id,
      type,
      classification: "transparent",
      rect: ZERO_RECT,
      style,
      children: [],
    };
  }

  if (cls === "leaf") {
    targets.set(id, fiber.stateNode);
    return {
      id,
      type,
      classification: "leaf",
      rect: ZERO_RECT,
      style,
      children: [],
    };
  }

  const children: BoneNode[] = [];
  let child = fiber.child;
  while (child !== null) {
    children.push(walk(child, classify, targets));
    child = child.sibling;
  }

  if (cls === "container") {
    targets.set(id, fiber.stateNode);
  }

  return { id, type, classification: cls, rect: ZERO_RECT, style, children };
}

function safeClassify(fiber: FiberNode, classify: ClassifyFn): ReturnType<ClassifyFn> {
  try {
    return classify(fiber);
  } catch (err) {
    if (typeof __DEV__ !== "undefined" && __DEV__)
      console.warn("[dynamic-shimmer] classify threw; falling back to default", err);
    return defaultClassify(fiber);
  }
}
