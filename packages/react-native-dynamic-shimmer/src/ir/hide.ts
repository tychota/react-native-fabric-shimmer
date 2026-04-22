import type { BoneNode } from "../types";

export function hide(tree: BoneNode, target: BoneNode): BoneNode {
  if (tree === target) {
    return { ...tree, classification: "transparent", children: [] };
  }
  let changed = false;
  const nextChildren: BoneNode[] = [];
  for (const child of tree.children) {
    if (child === target) {
      changed = true;
      continue;
    }
    const replaced = hide(child, target);
    if (replaced !== child) changed = true;
    nextChildren.push(replaced);
  }
  return changed ? { ...tree, children: nextChildren } : tree;
}
