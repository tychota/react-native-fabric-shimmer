# react-native-fabric-shimmer

## 0.1.0

### Minor Changes

- [`6b35aed`](https://github.com/tychota/react-native-fabric-shimmer/commit/6b35aedcfe7c6f0df3c826ea521196876b85e8ac) Thanks [@tychota](https://github.com/tychota)! - Initial public release.

  `<Skeleton loading>` wraps any component tree and paints animated bones at the exact positions of the real content, measured at runtime via Fabric's JSI `measureLayout`. No build-time scan, no JSON pre-bake — the real component is the skeleton.

  What's in the box:
  - **`Skeleton`** — the wrapper. Visibility honours a delay-then-min-show pattern (`delayShowDuration`, default 100 ms) so fast loads never flash a skeleton; once mounted, `minShowDuration` keeps it on screen long enough to avoid flicker. Three animations: `shimmer` (default), `pulse`, `none`. Fades in/out with `transition` (default 300 ms). Container bones (cards with bg + border) render statically using the captured source styling; leaf bones (text, image, view) animate with a hairline `highlightColor` outline.
  - **`Bone`** — default bone renderer; override per-rect with `renderBone`.
  - **`defaultClassify`** — `leaf` / `container` / `transparent` / `skip` from fiber type + flattened style. Only host fibers (`typeof fiber.type === "string"`) are classified — component fibers (forwardRefs like `<Text>`, `<Image>`) pass through to their host so measurement actually lands on a Fabric `stateNode`.
  - **IR helpers** — `walk`, `find`, `findAll`, `hide`, `merge`, `union` for `refineBones`.
  - **`dumpTree`** — formats a measured `BoneNode` tree as indented ASCII (type, classification, rect) for debugging custom classify/refine logic.

  Requirements: React Native ≥ 0.76 with the New Architecture enabled (Fabric); React ≥ 19; `react-native-reanimated` ≥ 4; `expo-linear-gradient` ≥ 15 (peer). React Compiler-safe. Honours `ReduceMotion.System`.

  120 tests across 22 files cover the IR helpers, fiber classification, measurement pipeline (`buildBoneTree` → `measureTree` → `flattenTree`), visibility hooks, Bone + Skeleton element trees, and `dumpTree`. ESM 5.2 kB gzip / CJS 5.3 kB gzip via `size-limit`. Reassure perf baseline at 10 and 30 bones.
