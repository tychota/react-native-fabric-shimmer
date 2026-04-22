import type { FiberNode } from "../../src/types";

// Minimal FiberNode-shaped object for walker/classifier tests.
// Sets child/sibling/return links manually.

type Props = Record<string, unknown>;

export type FakeFiber = {
  -readonly [K in keyof FiberNode]: FiberNode[K];
};

export function fiber(
  type: FiberNode["type"],
  props: Props = {},
  children: FakeFiber[] = [],
): FakeFiber {
  const node: FakeFiber = {
    type,
    memoizedProps: props,
    stateNode: props["__stateNode"] ?? { __fake: true },
    child: null,
    sibling: null,
    return: null,
  };
  for (let i = 0; i < children.length; i++) {
    const c = children[i]!;
    c.return = node as FiberNode;
    if (i === 0) node.child = c as FiberNode;
    if (i > 0) (children[i - 1]!).sibling = c as FiberNode;
  }
  return node;
}

export const View = (props: Props = {}, ...children: FakeFiber[]) => fiber("View", props, children);
export const Text = (children = "", props: Props = {}) =>
  fiber("RCTText", { ...props, children }, []);
export const Image = (props: Props = {}) => fiber("RCTImage", props, []);
