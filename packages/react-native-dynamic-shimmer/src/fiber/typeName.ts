import type { FiberNode } from "../types";

export function typeName(fiber: FiberNode): string {
  const t = fiber.type;
  if (typeof t === "string") return t;
  if (typeof t === "function") {
    const named = t as { displayName?: string; name?: string };
    if (typeof named.displayName === "string" && named.displayName.length > 0)
      return named.displayName;
    if (
      typeof named.name === "string" &&
      named.name.length > 0 &&
      named.name[0] === named.name[0]?.toUpperCase() &&
      named.name[0] !== named.name[0]?.toLowerCase()
    )
      return named.name;
    return "Component";
  }
  return "Unknown";
}
