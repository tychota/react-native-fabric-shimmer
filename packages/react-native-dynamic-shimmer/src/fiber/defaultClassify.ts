import type { FiberClassification, FiberNode } from "../types";
import { extractStyle } from "./extractStyle";
import { typeName } from "./typeName";

const CONTENT_TYPES: ReadonlySet<string> = new Set([
  "RCTText",
  "Text",
  "RawText",
  "RCTImage",
  "Image",
  "ImageView",
  "RCTTextInput",
  "TextInput",
]);

function isTransparent(color: string | undefined): boolean {
  if (color === undefined) return true;
  const c = color.toLowerCase().trim();
  return c === "transparent" || c === "rgba(0,0,0,0)" || c === "rgba(0, 0, 0, 0)";
}

function hasAnyRadius(r: unknown): boolean {
  if (typeof r === "number") return r > 0;
  if (r !== null && typeof r === "object") {
    for (const v of Object.values(r as Record<string, number>))
      if (typeof v === "number" && v > 0) return true;
  }
  return false;
}

export function defaultClassify(fiber: FiberNode): FiberClassification {
  // Only host fibers (native components) are measurable. Component fibers
  // — function components like Text, Image, or a custom <Card> — have no
  // native layout: their displayName happens to match content types, but
  // their stateNode is null and the real host sits one level below. Treat
  // them as transparent so the walker recurses to the host.
  if (typeof fiber.type !== "string") return "transparent";

  const name = typeName(fiber);
  if (CONTENT_TYPES.has(name)) return "leaf";

  const style = extractStyle(fiber);
  if (style.display === "none") return "skip";
  if (typeof style.opacity === "number" && style.opacity <= 0) return "skip";

  const hasBg = style.backgroundColor !== undefined && !isTransparent(style.backgroundColor);
  const hasBorder = (style.borderWidth ?? 0) > 0;
  const hasRadius = hasAnyRadius(style.borderRadius);
  const hasShadow = (style.shadowOpacity ?? 0) > 0 || (style.elevation ?? 0) > 0;
  const hasSurface = hasBg || hasBorder || hasRadius || hasShadow;

  if (fiber.child === null) return hasSurface ? "leaf" : "transparent";
  return hasSurface ? "container" : "transparent";
}
