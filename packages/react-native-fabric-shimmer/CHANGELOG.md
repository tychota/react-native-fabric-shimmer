# react-native-fabric-shimmer

## 0.2.0

### Minor Changes

- [`af8a1d4`](https://github.com/tychota/react-native-fabric-shimmer/commit/af8a1d4414a4d549bf1033ffee03250a2d2e828a) Thanks [@tychota](https://github.com/tychota)! - Internal: align example app to Expo SDK 55's exact pinned matrix; pin React + React Native in the workspace overrides to match.

  No public API changes. The library code is unchanged from v0.1.0 — this release exists to lock down the development matrix so the example app, docs, and Storybook all reconcile to the same React patch (19.2.0) and React Native patch (0.83.6), eliminating per-workspace duplicate-package warnings from `expo-doctor`. Library devDep `expo-linear-gradient` bumped from `^55.0.13` to `~55.0.14` (the version SDK 55 currently pins).

  The example app uses `~` ranges for SDK 55 packages going forward so dependabot won't drift them out of the SDK matrix; Dependabot is configured to ignore `expo` non-major bumps, `react`/`react-dom` (workspace-pinned), and `react-native-reanimated`/`react-native-worklets` (RN 0.83 Fabric pins). Vitest major bumps are also ignored — that migration is its own scoped effort.

  Dev-tool refresh bundled in this release:
  - `eslint-plugin-react-hooks` ^5.2.0 → ^7.1.1
  - `oxfmt` ^0.40.0 → ^0.49.0
  - `oxlint` ^1.50.0 → ^1.64.0
  - `oxlint-tsgolint` ^0.21.0 → ^0.22.1
  - `react-native-unistyles` ^3.0.0 → ^3.2.4 (example app)

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
