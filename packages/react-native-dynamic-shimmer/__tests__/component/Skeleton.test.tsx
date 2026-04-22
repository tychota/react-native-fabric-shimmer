// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("expo-linear-gradient", () => ({
  LinearGradient: (props: Record<string, unknown>) => React.createElement("LinearGradient", props),
}));

import { Skeleton } from "../../src/Skeleton";
import type { SkeletonProps } from "../../src/types";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function collectElements(
  node: React.ReactNode,
  acc: React.ReactElement[] = [],
): React.ReactElement[] {
  if (node === null || node === undefined || typeof node === "boolean") return acc;
  if (Array.isArray(node)) {
    for (const child of node) collectElements(child, acc);
    return acc;
  }
  if (typeof node === "string" || typeof node === "number") return acc;
  if (React.isValidElement(node)) {
    acc.push(node);
    const children = (node.props as { children?: React.ReactNode }).children;
    if (children !== undefined) collectElements(children, acc);
  }
  return acc;
}

function renderSkeleton(props: SkeletonProps) {
  return renderHook(() => Skeleton(props));
}

const baseProps = {
  baseColor: "#aaa",
  highlightColor: "#eee",
} as const;

const childMarker = React.createElement("Text", { "data-test": "child" }, "Hello");

describe("Skeleton", () => {
  it("renders an outer container with collapsable={false}", () => {
    const { result } = renderSkeleton({
      ...baseProps,
      loading: false,
      children: childMarker,
    });
    const outer = result.current;
    expect(React.isValidElement(outer)).toBe(true);
    const props = outer.props as { collapsable?: boolean };
    expect(props.collapsable).toBe(false);
  });

  it("passes children through when not loading", () => {
    const { result } = renderSkeleton({
      ...baseProps,
      loading: false,
      children: childMarker,
    });
    const all = collectElements(result.current);
    const found = all.find((el) => {
      const p = el.props as { ["data-test"]?: string };
      return p["data-test"] === "child";
    });
    expect(found).toBeDefined();
  });

  it("does NOT render the progressbar overlay before measurement completes", () => {
    const { result } = renderSkeleton({
      ...baseProps,
      loading: true,
      children: childMarker,
    });
    const all = collectElements(result.current);
    const overlay = all.find((el) => {
      const p = el.props as { accessibilityRole?: string };
      return p.accessibilityRole === "progressbar";
    });
    // Without a real ref + fiber + Fabric stateNode, useMeasureBones never
    // produces bones, so the overlay never mounts. The skeleton still
    // renders its container + content wrapper without crashing.
    expect(overlay).toBeUndefined();
  });

  it("marks the content wrapper as accessibilityElementsHidden when loading", () => {
    const { result } = renderSkeleton({
      ...baseProps,
      loading: true,
      children: childMarker,
    });
    const all = collectElements(result.current);
    const hiddenWrapper = all.find((el) => {
      const p = el.props as { accessibilityElementsHidden?: boolean };
      return p.accessibilityElementsHidden === true;
    });
    expect(hiddenWrapper).toBeDefined();
  });

  it("does NOT mark children hidden when not loading", () => {
    const { result } = renderSkeleton({
      ...baseProps,
      loading: false,
      children: childMarker,
    });
    const all = collectElements(result.current);
    const hiddenWrapper = all.find((el) => {
      const p = el.props as { accessibilityElementsHidden?: boolean };
      return p.accessibilityElementsHidden === true;
    });
    expect(hiddenWrapper).toBeUndefined();
  });

  it("uses pointerEvents='none' on content wrapper while loading", () => {
    const { result } = renderSkeleton({
      ...baseProps,
      loading: true,
      children: childMarker,
    });
    const all = collectElements(result.current);
    const noPointer = all.find((el) => {
      const p = el.props as { pointerEvents?: string };
      return p.pointerEvents === "none";
    });
    expect(noPointer).toBeDefined();
  });

  it("respects accessibilityLabel override", () => {
    // Even though the overlay isn't mounted, the label flows through to
    // useMeasureBones / overlay defaults; we verify the prop just shouldn't
    // throw and the component still renders.
    const { result } = renderSkeleton({
      ...baseProps,
      loading: false,
      children: childMarker,
      accessibilityLabel: "Loading user",
    });
    expect(React.isValidElement(result.current)).toBe(true);
  });

  it("does not crash when delayShowDuration is 0", () => {
    const { result } = renderSkeleton({
      ...baseProps,
      loading: true,
      children: childMarker,
      delayShowDuration: 0,
    });
    expect(React.isValidElement(result.current)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(50);
    });
  });
});
