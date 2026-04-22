import type { BoneNode } from "../types";
import { isFabricHost, measureLayout } from "../platform/fabric";
import type { FabricHostStateNode } from "../platform/fabric";

export async function measureTree(
  tree: BoneNode,
  targets: Map<string, unknown>,
  container: unknown,
): Promise<BoneNode> {
  if (!isFabricHost(container)) return tree;
  const containerHost: FabricHostStateNode = container;
  const ids: string[] = [];
  const hosts: FabricHostStateNode[] = [];
  for (const [id, stateNode] of targets) {
    if (isFabricHost(stateNode)) {
      ids.push(id);
      hosts.push(stateNode);
    }
  }
  const results = await Promise.all(hosts.map((h) => measureLayout(h, containerHost)));
  const rectById = new Map<string, { x: number; y: number; width: number; height: number }>();
  const droppedIds = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    const rect = results[i];
    const id = ids[i]!;
    if (rect === null || rect === undefined) droppedIds.add(id);
    else rectById.set(id, rect);
  }
  return attach(tree, rectById, droppedIds);
}

function attach(
  node: BoneNode,
  rects: Map<string, { x: number; y: number; width: number; height: number }>,
  dropped: Set<string>,
): BoneNode {
  const children = node.children.map((c) => attach(c, rects, dropped));
  if (dropped.has(node.id)) return { ...node, classification: "transparent", children };
  const r = rects.get(node.id);
  if (r !== undefined) return { ...node, rect: r, children };
  return { ...node, children };
}
