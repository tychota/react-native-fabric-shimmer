import type { FiberNode } from "../types";

export function getFiber(ref: unknown): FiberNode | null {
  if (ref === null || ref === undefined) return null;
  const handle = (ref as { __internalInstanceHandle?: FiberNode }).__internalInstanceHandle;
  return handle ?? null;
}
