import type { BoneNode } from "../types";

// Render a BoneNode tree as an indented, human-readable string —
// one node per line, showing type, classification, and rect.
//
// Useful when wiring up a new Skeleton: pass an `onMeasured` handler or
// inspect the result of `buildBoneTree` + `measureTree` to understand what
// the walker is seeing. Paired with the devtools inspector you can decide
// whether to tune `classify` (e.g. mark a host as transparent) or adjust
// your content structure (e.g. add `collapsable={false}` where Fabric is
// flattening a wrapper you want to measure).
//
// Example output:
//   RCTView [transparent] (0,0 0×0)
//     RCTView [container] (0,0 370×118)
//       ViewManagerAdapter_ExpoImage [leaf] (17,17 56×56)
//       RCTText [leaf] (85,17 95×20)
//       RCTText [leaf] (85,41 268×16)
//       RCTText [leaf] (85,65 268×36)
export function dumpTree(tree: BoneNode): string {
  const lines: string[] = [];
  append(tree, 0, lines);
  return lines.join("\n");
}

function append(node: BoneNode, depth: number, out: string[]): void {
  const indent = "  ".repeat(depth);
  const { x, y, width, height } = node.rect;
  const rect = `${x.toFixed(0)},${y.toFixed(0)} ${width.toFixed(0)}×${height.toFixed(0)}`;
  out.push(`${indent}${node.type} [${node.classification}] (${rect})`);
  for (const child of node.children) append(child, depth + 1, out);
}
