import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFabricUIManager, isFabricHost, measureLayout } from "../../../src/platform/fabric";

type NativeFabric = {
  measureLayout: (
    node: unknown,
    relativeNode: unknown,
    onFail: () => void,
    onSuccess: (x: number, y: number, w: number, h: number) => void,
  ) => void;
};

function mockNativeFabric(impl: NativeFabric): void {
  (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager = impl;
}

function clearNativeFabric(): void {
  delete (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager;
}

describe("isFabricHost", () => {
  it("returns true for a Fabric host state node ({ node, canonical })", () => {
    const fabricStateNode = {
      node: { __jsiHandle: true },
      canonical: { nativeTag: 42, viewConfig: {}, currentProps: {} },
    };
    expect(isFabricHost(fabricStateNode)).toBe(true);
  });

  it("returns false for null, undefined, primitives, and empty objects", () => {
    expect(isFabricHost(null)).toBe(false);
    expect(isFabricHost(undefined)).toBe(false);
    expect(isFabricHost({})).toBe(false);
    expect(isFabricHost("string")).toBe(false);
    expect(isFabricHost(7)).toBe(false);
  });

  it("returns false for a Paper-style host (no node/canonical, just measureLayout)", () => {
    expect(isFabricHost({ measureLayout: () => {} })).toBe(false);
  });

  it("returns false when canonical is missing or non-object", () => {
    expect(isFabricHost({ node: {} })).toBe(false);
    expect(isFabricHost({ node: {}, canonical: null })).toBe(false);
    expect(isFabricHost({ node: {}, canonical: "nope" })).toBe(false);
  });
});

describe("getFabricUIManager", () => {
  afterEach(() => {
    clearNativeFabric();
  });

  it("returns null when nativeFabricUIManager is absent", () => {
    clearNativeFabric();
    expect(getFabricUIManager()).toBeNull();
  });

  it("returns null when nativeFabricUIManager lacks measureLayout", () => {
    mockNativeFabric({} as never);
    expect(getFabricUIManager()).toBeNull();
  });

  it("returns the global when measureLayout is a function", () => {
    const impl: NativeFabric = { measureLayout: () => {} };
    mockNativeFabric(impl);
    expect(getFabricUIManager()).toBe(impl);
  });
});

describe("measureLayout", () => {
  beforeEach(() => {
    clearNativeFabric();
  });
  afterEach(() => {
    clearNativeFabric();
  });

  const childHost = {
    node: { kind: "child" },
    canonical: {},
  };
  const containerHost = {
    node: { kind: "container" },
    canonical: {},
  };

  it("resolves null when no Fabric UI manager is present", async () => {
    await expect(measureLayout(childHost, containerHost)).resolves.toBeNull();
  });

  it("resolves to a rect when success callback fires", async () => {
    const measureLayoutSpy = vi.fn(
      (
        _node: unknown,
        _relative: unknown,
        _onFail: () => void,
        onSuccess: (x: number, y: number, w: number, h: number) => void,
      ) => {
        onSuccess(1, 2, 3, 4);
      },
    );
    mockNativeFabric({ measureLayout: measureLayoutSpy });

    await expect(measureLayout(childHost, containerHost)).resolves.toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
    });
    expect(measureLayoutSpy).toHaveBeenCalledTimes(1);
    expect(measureLayoutSpy.mock.calls[0]![0]).toBe(childHost.node);
    expect(measureLayoutSpy.mock.calls[0]![1]).toBe(containerHost.node);
  });

  it("resolves null when fail callback fires", async () => {
    mockNativeFabric({
      measureLayout: (_n, _r, onFail) => {
        onFail();
      },
    });
    await expect(measureLayout(childHost, containerHost)).resolves.toBeNull();
  });

  it("resolves null when any coord is not finite", async () => {
    mockNativeFabric({
      measureLayout: (_n, _r, _f, onSuccess) => {
        onSuccess(Number.NaN, 0, 10, 10);
      },
    });
    await expect(measureLayout(childHost, containerHost)).resolves.toBeNull();
  });

  it("resolves null when the native call throws", async () => {
    mockNativeFabric({
      measureLayout: () => {
        throw new Error("boom");
      },
    });
    await expect(measureLayout(childHost, containerHost)).resolves.toBeNull();
  });
});
