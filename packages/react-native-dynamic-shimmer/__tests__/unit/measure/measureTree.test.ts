import { afterEach, describe, expect, it } from "vitest";
import type { BoneNode } from "../../../src/types";
import { measureTree } from "../../../src/measure/measureTree";

type Rect = { x: number; y: number; width: number; height: number };

type NodeHandle = { rect: Rect | null };

function fabricHost(rect: Rect | null) {
  return {
    node: { rect } satisfies NodeHandle,
    canonical: {},
  };
}

function installFabricUIManager(): void {
  (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager = {
    measureLayout: (
      node: unknown,
      _relative: unknown,
      onFail: () => void,
      onSuccess: (x: number, y: number, w: number, h: number) => void,
    ) => {
      const handle = node as NodeHandle;
      if (handle.rect === null) onFail();
      else onSuccess(handle.rect.x, handle.rect.y, handle.rect.width, handle.rect.height);
    },
  };
}

function clearFabricUIManager(): void {
  delete (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager;
}

describe("measureTree", () => {
  afterEach(() => {
    clearFabricUIManager();
  });

  it("attaches rects from measurement to matching ids", async () => {
    installFabricUIManager();
    const tree: BoneNode = {
      id: "root",
      type: "View",
      classification: "container",
      rect: { x: 0, y: 0, width: 0, height: 0 },
      style: {},
      children: [
        {
          id: "a",
          type: "RCTText",
          classification: "leaf",
          rect: { x: 0, y: 0, width: 0, height: 0 },
          style: {},
          children: [],
        },
      ],
    };
    const container = fabricHost({ x: 0, y: 0, width: 100, height: 50 });
    const targets = new Map<string, unknown>([
      ["root", container],
      ["a", fabricHost({ x: 10, y: 5, width: 80, height: 20 })],
    ]);
    const out = await measureTree(tree, targets, container);
    expect(out.rect.width).toBe(100);
    expect(out.children[0]!.rect).toEqual({ x: 10, y: 5, width: 80, height: 20 });
  });

  it("marks nodes with failed measurement as transparent (dropped)", async () => {
    installFabricUIManager();
    const tree: BoneNode = {
      id: "root",
      type: "View",
      classification: "container",
      rect: { x: 0, y: 0, width: 0, height: 0 },
      style: {},
      children: [
        {
          id: "a",
          type: "RCTText",
          classification: "leaf",
          rect: { x: 0, y: 0, width: 0, height: 0 },
          style: {},
          children: [],
        },
      ],
    };
    const container = fabricHost({ x: 0, y: 0, width: 100, height: 50 });
    const targets = new Map<string, unknown>([
      ["root", container],
      ["a", fabricHost(null)],
    ]);
    const out = await measureTree(tree, targets, container);
    expect(out.children[0]!.classification).toBe("transparent");
  });

  it("returns the tree untouched if the container is not a Fabric host", async () => {
    installFabricUIManager();
    const tree: BoneNode = {
      id: "root",
      type: "View",
      classification: "container",
      rect: { x: 0, y: 0, width: 0, height: 0 },
      style: {},
      children: [],
    };
    const out = await measureTree(tree, new Map(), { not: "a fabric host" });
    expect(out).toBe(tree);
  });

  it("skips non-Fabric stateNodes in targets", async () => {
    installFabricUIManager();
    const tree: BoneNode = {
      id: "root",
      type: "View",
      classification: "container",
      rect: { x: 0, y: 0, width: 0, height: 0 },
      style: {},
      children: [
        {
          id: "a",
          type: "RCTText",
          classification: "leaf",
          rect: { x: 0, y: 0, width: 0, height: 0 },
          style: {},
          children: [],
        },
      ],
    };
    const container = fabricHost({ x: 0, y: 0, width: 100, height: 50 });
    const targets = new Map<string, unknown>([
      ["root", container],
      ["a", null],
    ]);
    const out = await measureTree(tree, targets, container);
    expect(out.children[0]!.rect).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
