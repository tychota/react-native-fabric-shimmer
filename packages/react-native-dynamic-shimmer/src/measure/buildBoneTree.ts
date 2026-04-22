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

export function buildBoneTree(fiber: FiberNode, classify: ClassifyFn = defaultClassify): BoneNode {
  const cls = safeClassify(fiber, classify);
  const id = nextId();
  const type = typeName(fiber);
  const style = extractStyle(fiber);

  if (cls === "skip" || cls === "leaf") {
    return {
      id,
      type,
      classification: cls === "skip" ? "transparent" : "leaf",
      rect: ZERO_RECT,
      style,
      children: [],
    };
  }

  const children: BoneNode[] = [];
  let child = fiber.child;
  while (child !== null) {
    children.push(buildBoneTree(child, classify));
    child = child.sibling;
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
