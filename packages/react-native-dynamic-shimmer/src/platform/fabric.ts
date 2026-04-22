// React Native Fabric host fibers carry a state node of shape
// `{ node, canonical }` where `node` is the JSI shadow-node handle and
// `canonical` holds the viewConfig/publicInstance metadata. Measurement
// goes through `global.nativeFabricUIManager.measureLayout`, not a method
// on the host component itself.
export type FabricHostStateNode = {
  node: unknown;
  canonical: unknown;
};

export function isFabricHost(value: unknown): value is FabricHostStateNode {
  if (value === null || value === undefined) return false;
  if (typeof value !== "object") return false;
  const o = value as { node?: unknown; canonical?: unknown };
  return o.node !== undefined && o.canonical !== null && typeof o.canonical === "object";
}

export type MeasuredRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FabricUIManager = {
  measureLayout: (
    node: unknown,
    relativeNode: unknown,
    onFail: () => void,
    onSuccess: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

export function getFabricUIManager(): FabricUIManager | null {
  const g = globalThis as { nativeFabricUIManager?: unknown };
  const m = g.nativeFabricUIManager;
  if (m === null || m === undefined) return null;
  if (typeof (m as { measureLayout?: unknown }).measureLayout !== "function") return null;
  return m as FabricUIManager;
}

export function measureLayout(
  child: FabricHostStateNode,
  container: FabricHostStateNode,
): Promise<MeasuredRect | null> {
  return new Promise((resolve) => {
    const fabric = getFabricUIManager();
    if (fabric === null) {
      resolve(null);
      return;
    }
    try {
      fabric.measureLayout(
        child.node,
        container.node,
        () => resolve(null),
        (x, y, width, height) => {
          if (
            Number.isFinite(x) &&
            Number.isFinite(y) &&
            Number.isFinite(width) &&
            Number.isFinite(height)
          ) {
            resolve({ x, y, width, height });
          } else resolve(null);
        },
      );
    } catch {
      resolve(null);
    }
  });
}
