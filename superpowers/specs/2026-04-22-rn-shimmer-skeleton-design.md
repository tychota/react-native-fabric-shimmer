# `react-native-dynamic-shimmer` — Design spec

**Date:** 2026-04-22 **Status:** approved, ready for implementation planning **Author:** Tycho Tatitscheff (`tycho.tatitscheff@theodo.com`) **Target package:** `react-native-dynamic-shimmer` (unscoped, published by the `tychota` npm user) **Target repo:** `github.com/tychota/react-native-dynamic-shimmer`

---

## 1. Overview

A React Native component that displays a shimmer loading state for any component **without requiring the component to be modified**. The real component renders with mock data while loading; the library measures its native layout synchronously via Fabric's JSI `measureLayout`, and paints shimmer rectangles at the measured positions. When loading ends, the shimmer fades out and the real content takes over.

The library inherits the central insight from Nicușor Cîciudan's "Let's build dynamic shimmer skeletons" blog post — _the real component IS the skeleton_ — but replaces the web-specific `querySelectorAll` + `getBoundingClientRect` path with Fabric's synchronous measurement. On modern React Native, that is cheap enough (microseconds per `measureLayout` call) that the build-time scan pipeline used by `boneyard` and the original prototype is unnecessary.

One component. One runtime measurement pass. No CLI, no JSON bones, no drift between code and skeleton.

## 2. Goals and non-goals

### Goals

- **Consumer components stay untouched.** Wrap, pass mock data, done.
- **No build-time tooling.** No JSON files, no CLI, no watch-mode scans.
- **Accessible by default.** Progress-bar role, hidden content during loading, reduce-motion support.
- **Extensible in 5 well-chosen dimensions:** colors, animation style, bone renderer, fiber classifier, IR refiner.
- **React Compiler safe.** No manual `useMemo` / `useCallback` / `React.memo`; no escape-hatch directives needed.
- **First-class TypeScript.** All public APIs typed strictly; IR exposed as plain data structures so consumers never touch React internals.

### Non-goals

- **Old Architecture (Paper).** Not supported. Fabric is a hard requirement.
- **React Native Web.** Not a target. The `"react-native"` export condition resolves to source; web consumers use web shims but are not tested or guaranteed.
- **Server-side rendering.** Irrelevant for RN.
- **Build-time skeleton generation.** Explicitly rejected — the runtime cost on Fabric is negligible, and the build-time path introduces drift between code and skeleton.
- **Mock data generation.** Consumers own their mock data (via types, factories, or whatever pattern they use). The library only renders what they pass.
- **Theming context.** Colors are flat props. Consumers integrate with their own theming system (Unistyles, React Navigation theme, etc.).
- **Universal animation library.** Shimmer + pulse are shipped; other animations go through `renderBone`.

## 3. Target stack

Pinned, not "best-effort supported":

| Dependency                      | Minimum                                  | Why pinned                                                                                                      |
| ------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| React Native                    | 0.76                                     | Fabric `ReactFabricHostComponent.measureLayout` as a JSI call; new-arch view flattening semantics               |
| React                           | 19                                       | React Compiler stable; `useDeferredValue` semantics as-documented; `__internalInstanceHandle` fiber access path |
| react-native-reanimated         | 3.17                                     | `ReduceMotion.System` enum; compiler compatibility; worklet plugin moved to `react-native-worklets/plugin`      |
| expo-linear-gradient            | 15 (or `react-native-linear-gradient` 3) | Standard gradient for the shimmer sweep                                                                         |
| TypeScript (consumer, optional) | 5.8                                      | `const` type parameters, `satisfies`, `exactOptionalPropertyTypes`                                              |

Old Architecture is detected at runtime — the library throws a dev-only error if it finds an old-arch host component.

## 4. Decisions made during brainstorming

These choices are fixed going into implementation. Rationale is summarized where it isn't obvious.

| Decision            | Choice                                                                                                                           | Rationale                                                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scan strategy       | Runtime-scan only                                                                                                                | On Fabric `measureLayout` is microseconds; build-time scan's dev/prod split is a vestige of web constraints                                                                                       |
| Package name        | `react-native-dynamic-shimmer` (unscoped)                                                                                        | Published under the `tychota` npm user; matches conventional naming for RN community libraries. The `@theodo.com` scope exists on npm but this author has no publish access, so we stay unscoped. |
| Monorepo            | pnpm workspaces, `packages/` + `apps/` + `docs/`                                                                                 | Expo's guidance and pnpm's resolver semantics are the most predictable                                                                                                                            |
| Package manager     | pnpm                                                                                                                             | Metro + pnpm is battle-tested; Bun has an open Metro transitive-dep bug that blocks contributors                                                                                                  |
| Builder             | `tsdown` + `tsc --emitDeclarationOnly`                                                                                           | Rolldown-based, Rust-speed, no Babel → no accidental worklet transforms                                                                                                                           |
| Linter              | `oxlint` + JS-plugin for `eslint-plugin-react-hooks`                                                                             | Oxlint is Rust-fast; react-compiler rules moved into `eslint-plugin-react-hooks` and are loaded via jsPlugins                                                                                     |
| Formatter           | `oxfmt`                                                                                                                          | Part of the Oxc ecosystem; same mental model as oxlint                                                                                                                                            |
| Tests               | Vitest (unit) + RTL (component) + Storybook/Chromatic (visual web-preview) + Maestro (E2E + native screenshot) + Reassure (perf) | Full fat testing as requested                                                                                                                                                                     |
| Docs                | Astro Starlight on GitHub Pages                                                                                                  | Markdown-first, fast, search built in                                                                                                                                                             |
| License             | MIT                                                                                                                              | Standard for OSS RN libraries                                                                                                                                                                     |
| Release             | Changesets                                                                                                                       | Monorepo-native, PR-based changelog, clean integration with pnpm                                                                                                                                  |
| TypeScript          | 5.8, strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes                                                              | Maximum signal                                                                                                                                                                                    |
| Versions            | Node 20 LTS, pnpm 9 pinned via `mise.toml`                                                                                       | Deterministic contributor environments                                                                                                                                                            |
| Anti-flicker        | `useDeferredValue` (device-adaptive debounce) + `useStickyBoolean` (wall-clock min duration)                                     | React scheduler hooks don't provide wall-clock timing; composing the two gives the best of both                                                                                                   |
| Bone classification | 4-way: `leaf` / `container` / `transparent` / `skip`                                                                             | Binary `isLeaf` can't express "emit a bone AND continue descent" for cards with distinctive visuals                                                                                               |
| Tree refinement     | Plain JS IR (`BoneNode`) + `walk`/`find`/`hide`/`merge`/`union` helpers                                                          | Consumers reason about the visible shape of the card, not React fibers                                                                                                                            |
| Peer dep handling   | `tsdown external:` + `"react-native"` conditional export                                                                         | RN consumers hit source directly; web consumers get bundled dist                                                                                                                                  |

## 5. Architecture

### 5.1 Philosophy

The library is a thin orchestrator around four primitives:

1. **Visibility decision** — should the shimmer be showing right now?
2. **Measurement pipeline** — which native rectangles should be shimmering?
3. **Animation driver** — one shared oscillator driving every bone.
4. **Rendering** — absolute-positioned views with a gradient sweep.

Each primitive is a dedicated module with a narrow interface; consumer-facing props map 1-to-1 onto extension points at the module boundaries.

### 5.2 Public surface

Everything a consumer interacts with. Nothing else is exported.

```ts
export { Skeleton } from "./Skeleton";
export { Bone } from "./Bone";

export {
  // IR helpers for `refineBones`
  walk,
  find,
  findAll,
  hide,
  merge,
  union,
} from "./ir";

export type {
  SkeletonProps,
  BoneProps,
  BoneContext,
  BoneRect,
  BoneKind,
  BoneNode,
  FiberNode,
  FiberClassification,
  RenderBoneFn,
  ClassifyFn,
  RefineBonesFn,
  AnimationKind,
} from "./types";
```

Nothing else. Anything not listed here is internal.

### 5.3 `<Skeleton>` props

```ts
type SkeletonProps = {
  // Required
  loading: boolean;
  children: ReactNode;
  baseColor: string;
  highlightColor: string;

  // Optional — visual
  animation?: "shimmer" | "pulse" | "none"; // default 'shimmer'
  transition?: boolean | number; // default 300ms
  minShowDuration?: number; // default 500ms

  // Optional — extension hooks (in complexity order)
  renderBone?: RenderBoneFn;
  classify?: ClassifyFn;
  refineBones?: RefineBonesFn;

  // Optional — observability
  onMeasured?: (bones: ReadonlyArray<BoneRect>) => void;

  // Optional — layout / a11y
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string; // default "Loading"
};
```

### 5.4 Domain types

```ts
type BoneKind = "text" | "image" | "view" | "container";

type BoneRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly borderRadius: number | "50%"; // '50%' = perfect circle
  readonly kind: BoneKind;
  readonly backgroundColor?: string; // style hint
  readonly borderColor?: string;
  readonly borderWidth?: number;
};

type BoneContext = {
  readonly progress: SharedValue<number>; // 0..1 oscillator shared across all bones
  readonly baseColor: string;
  readonly highlightColor: string;
  readonly animation: "shimmer" | "pulse" | "none";
  readonly index: number; // this bone's position
  readonly total: number; // total bone count
};

// What the default <Bone> component accepts; exposed for custom renderBone
// implementations that want to compose the default visual.
type BoneProps = {
  readonly rect: BoneRect;
  readonly ctx: BoneContext;
};

// The IR passed to refineBones
type BoneNode = {
  readonly id: string; // stable within one scan
  readonly type: string; // 'View', 'Text', 'UserCard', etc.
  readonly classification: "leaf" | "container" | "transparent";
  readonly rect: { x: number; y: number; width: number; height: number };
  readonly style: {
    backgroundColor?: string;
    borderRadius?:
      | number
      | {
          topLeft?: number;
          topRight?: number;
          bottomLeft?: number;
          bottomRight?: number;
        };
    borderColor?: string;
    borderWidth?: number;
  };
  readonly children: ReadonlyArray<BoneNode>;
};

// Narrow projection of React fiber — enough to identify leaves without exposing internals
type FiberNode = {
  readonly type: string | Function | null;
  readonly memoizedProps: unknown;
  readonly stateNode: unknown;
  readonly child: FiberNode | null;
  readonly sibling: FiberNode | null;
  readonly return: FiberNode | null;
};

type FiberClassification = "leaf" | "container" | "transparent" | "skip";

type RenderBoneFn = (rect: BoneRect, ctx: BoneContext) => ReactNode;
type ClassifyFn = (fiber: FiberNode) => FiberClassification;
type RefineBonesFn = (tree: BoneNode) => BoneNode;
type AnimationKind = "shimmer" | "pulse" | "none";
```

### 5.5 Extension semantics

Hooks compose in the following pipeline:

```
fiber tree
  → classify(fiber)            ← per-node, filters what becomes a bone candidate
  → measureLayout              ← parallel JSI calls to Fabric
  → refineBones(tree)          ← user operates on a plain IR with helpers
  → flatten                    ← IR → BoneRect[]
  → renderBone(rect, ctx)      ← per-bone, replaces the default visual
```

| Hook                         | Default                                                                                                                                                                                                                                                                                                                                                      | When to override                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `classify`                   | `leaf` for text/image/text-input and for childless host views with a visible surface (backgroundColor / border / divider line); `container` for host views that have children AND distinctive visuals (bg, borderRadius, borderWidth, shadow, elevation); `skip` for hidden nodes (`display: 'none'`, `opacity: 0`); `transparent` for plain layout wrappers | Custom host-like components; skip a decorative wrapper                 |
| `refineBones`                | identity                                                                                                                                                                                                                                                                                                                                                     | Merge adjacent text runs; hide decorative icons; re-shape radii        |
| `renderBone`                 | `<Bone>` with LinearGradient sweep                                                                                                                                                                                                                                                                                                                           | Custom visuals (BlurView, SVG, gradient ring)                          |
| `baseColor`/`highlightColor` | required                                                                                                                                                                                                                                                                                                                                                     | Theming, dark mode, brand                                              |
| `animation`                  | `'shimmer'`                                                                                                                                                                                                                                                                                                                                                  | `'pulse'` for simpler aesthetic; `'none'` for static snapshots / tests |

All hooks are **pure functions** called on the JS thread. React hooks are **not** allowed inside them. Consumers who want per-bone dynamic animations do so via a custom component in `renderBone`, where hooks are fine.

## 6. Internal structure

### 6.1 Package directory layout

```
packages/react-native-dynamic-shimmer/src/
├── index.ts                       # public barrel — exactly the exports in §5.2
├── types.ts                       # shared type definitions
│
├── Skeleton.tsx                   # top-level orchestrator, ~120 lines
├── Bone.tsx                       # default bone renderer, ~70 lines
│
├── visibility/
│   ├── useVisibility.ts           # useDeferredValue + useStickyBoolean composition
│   └── useStickyBoolean.ts        # primitive: min-duration lock-in
│
├── measure/
│   ├── useMeasureBones.ts         # orchestrator hook
│   ├── buildBoneTree.ts           # pure: fiber → unmeasured IR
│   ├── measureTree.ts             # async: attaches rects via Fabric measureLayout
│   └── flattenTree.ts             # pure: IR → BoneRect[]
│
├── fiber/
│   ├── getFiber.ts                # ref → FiberNode
│   ├── typeName.ts                # FiberNode → display string
│   ├── extractStyle.ts            # memoizedProps.style → flat StyleHints
│   └── defaultClassify.ts         # default ClassifyFn
│
├── ir/
│   ├── walk.ts
│   ├── find.ts
│   ├── hide.ts
│   ├── merge.ts
│   └── union.ts
│
├── animation/
│   ├── useShimmerProgress.ts      # SharedValue oscillator, ReduceMotion.System
│   ├── shimmerStyle.ts            # worklet-safe: translateX sweep math
│   └── pulseStyle.ts              # worklet-safe: opacity interpolation
│
└── platform/
    └── fabric.ts                  # isFabricHost(), measureLayout() wrapper
```

~16 source files, ~1500 lines. Most files ≤ 100 lines.

### 6.2 CRC cards

**`Skeleton.tsx`** — orchestrator. Owns container ref, `animation` kind, color props, transition state. Delegates visibility to `useVisibility`, measurement to `useMeasureBones`, animation to `useShimmerProgress`. Does not touch fibers, worklets, or measurement directly.

**`Bone.tsx`** — default bone renderer. Renders an absolute-positioned `<View>` with `baseColor` and a child `<LinearGradient>` animated via `useAnimatedStyle` using `shimmerStyle` or `pulseStyle`. Stable public component — safe for consumers to use inside custom `renderBone` implementations.

**`visibility/useVisibility.ts`** — the anti-flicker decision, composed of `useDeferredValue(loading)` and `useStickyBoolean`. Returns `isVisible`. 15 lines.

**`visibility/useStickyBoolean.ts`** — primitive. Once `value` becomes `true`, keeps it true for at least `minDurationMs` (wall-clock). If `value` is `true` on initial mount, the sticky period starts at mount-time. Uses `useState` + `useRef` + `useEffect` with a single `setTimeout`. Timer is cancelled on unmount and on each `value` change so rapid toggles don't accumulate timers.

**`measure/useMeasureBones.ts`** — runs the pipeline on container layout. Owns `useState<BoneRect[] | null>`, last-size ref, run-id ref (to cancel stale measurements). Calls `buildBoneTree → measureTree → refineBones → flattenTree` in sequence.

**`measure/buildBoneTree.ts`** — pure function. Walks fibers via an iterative work queue (no recursion), calls `classify` per node, emits an unmeasured IR tree. Does not touch `stateNode` or measurement.

**`measure/measureTree.ts`** — async function. Walks the unmeasured tree, issues `measureLayout` calls in parallel via `Promise.all`, attaches rects. Drops nodes whose measurement fails with a dev warning.

**`measure/flattenTree.ts`** — pure function. Depth-first pre-order traversal producing `BoneRect[]`. Containers emit before their children (so render order paints containers behind content). Filters out `transparent` / `skip`.

**Fiber utilities** (`fiber/`) — `getFiber` dereferences `ref.current.__internalInstanceHandle`; `typeName` normalizes fiber type to a string (`displayName` first); `extractStyle` flattens `memoizedProps.style` (arrays, nested, StyleSheet.flatten-equivalent) into `StyleHints`; `defaultClassify` implements the 4-way rule from §5.5.

**IR helpers** (`ir/`) — public, pure, immutable. `walk(tree, visit)` with path; `find` / `findAll` by predicate; `hide(tree, target)` returns a new tree with target marked skipped; `merge(tree, targets)` returns a new tree with a merged parent (union rect) and targets hidden; `union(rects)` is the bounding-rect utility.

**`animation/useShimmerProgress.ts`** — single `SharedValue<number>` oscillator shared by all bones in a `Skeleton`. Uses `withRepeat(withTiming(1, { ..., reduceMotion: ReduceMotion.System }), -1)`. Cancels on unmount via `cancelAnimation`.

**`animation/shimmerStyle.ts`** and **`pulseStyle.ts`** — pure worklet-safe functions. Called inside `useAnimatedStyle` in `Bone.tsx`. No hooks, no React.

**`platform/fabric.ts`** — one file, two exports. `isFabricHost(node): node is FabricHostComponent` is a pure type guard (no side effects). `measureLayout(child, container)` returns `Promise<Rect | null>` wrapping the callback API. Callers check `isFabricHost` and implement the "dev throws, prod falls through" policy at the call site (`useMeasureBones`) — keeping the platform file free of env branching. Only file that knows about JSI specifics.

### 6.3 Interface invariants

- **Fiber never escapes `buildBoneTree`.** Measurement, flattening, and IR helpers operate on plain data. Only `fiber/` and `buildBoneTree.ts` touch React internals.
- **Worklets stay in `animation/` and inside `Bone.tsx`'s `useAnimatedStyle`.** `Skeleton.tsx` never calls worklet code.
- **Extension hooks are pure.** `classify`, `refineBones`, `renderBone` must not call React hooks. Documented; not enforced at runtime (we trust the consumer, fall back to default if a hook throws).
- **IR immutability.** `refineBones` returns a tree; helpers return new trees. Makes memoization and testing trivial.
- **`platform/fabric.ts` is the only JSI-aware file.** Future API changes localized to one file.

## 7. Data flow

### 7.1 The loading → first shimmer cycle

```
Frame T   : loading=true committed
Frame T   : onLayout(container) fires
            handleLayout schedules requestAnimationFrame
Frame T+1 : getFiber(ref.current) → rootFiber
            buildBoneTree(rootFiber, classify) → UnmeasuredBoneTree (sync)
            measureTree(tree, container) → Promise<BoneTree> (parallel measureLayout)
            refineBones(tree) (sync, if provided)
            flattenTree(tree) → BoneRect[]
            setState(bones)
Frame T+2 : React commits, overlay mounts
            useAnimatedStyle worklets install
            first shimmer frame visible
```

Typical end-to-end: **~50 ms** on a modern device; **~100 ms** under load. Negligible for a loading indicator.

### 7.2 Visibility state machine

```
loading ──▶ useDeferredValue ──▶ deferredLoading
                                       │
                                       ▼
             loading && deferredLoading ──▶ shouldShow
                                       │
                                       ▼
             useStickyBoolean(shouldShow, minShowDuration) ──▶ isVisible
```

- Short loading (sub-frame): `deferredLoading` never catches up; no skeleton, no measurement.
- Medium loading: `shouldShow` flips `true`; sticky holds it.
- Loading ends while sticky is holding: `shouldShow` flips `false`; `isVisible` stays `true` until `minShowDuration` elapses from when it first flipped on. Then fade-out.

### 7.3 Animation flow

One `SharedValue<number>` per `<Skeleton>`; every bone's `useAnimatedStyle` reads it. All math runs on the UI thread. The React tree does not re-render when progress changes.

```ts
// worklet inside shimmerStyle
const phase = rect.x / Math.max(1, rect.width * 4);
const t = (progress - phase * 0.6 + 1) % 1;
const barW = rect.width * 0.4;
const translateX = interpolate(t, [0, 1], [-barW, rect.width]);
return { opacity: 1, width: barW, transform: [{ translateX }] };
```

Phase depends on the bone's x position, so bones on the left begin sweeping before bones on the right — visually, light travels across the whole card coherently.

### 7.4 Transition on loading falling edge

Two animations parallel on `isVisible → false`:

1. Shimmer oscillator keeps going until the overlay unmounts (no abrupt freeze).
2. `withTiming(0, { duration: transition })` on the overlay's opacity. In the `finished` callback, `runOnJS(setMounted)(false)` unmounts the overlay and cancels the shimmer oscillator.

### 7.5 Container resize

`onLayout` re-fires on orientation change / split-view resize. Pipeline re-runs only if container size changed beyond a small threshold. Measurement is debounced by keeping a single in-flight run-id; a second layout while the first is pending cancels the first.

### 7.6 Render output during loading

The render output depends on three state bits — `loading` (external prop), `isVisible` (result of `useVisibility`), and `bones` (measured rects, initially `null`) — and resolves as follows:

| `loading` | `isVisible` | `bones`      | Children opacity | Overlay          | User sees                                              |
| --------- | ----------- | ------------ | ---------------- | ---------------- | ------------------------------------------------------ |
| `false`   | `false`     | `null` / any | `1`              | not rendered     | real content (the normal case)                         |
| `true`    | `false`     | `null`       | `0` (hidden)     | not rendered     | blank container for the debounce window                |
| `true`    | `true`      | `null`       | `0` (hidden)     | not rendered     | blank container until measurement completes (~1 frame) |
| `true`    | `true`      | present      | `0` (hidden)     | shimmer          | the skeleton                                           |
| `false`   | `true`      | present      | `0` (hidden)     | shimmer (fading) | skeleton fading out during transition / sticky tail    |

Key invariants:

- **Children always render** while `loading=true` (we measure them), but at `opacity: 0` with `importantForAccessibility="no-hide-descendants"` throughout the loading lifecycle. This prevents one-frame flashes of mock data, even during the debounce window. The "blank container" state is intentional: for fast loads, the user waits a frame or two before real content appears — better than seeing mock data briefly.
- **Overlay renders only when `isVisible && bones !== null`.** Absolute-filled over the children. `accessibilityRole="progressbar"` + `accessibilityState={{ busy: true }}` + `accessibilityLabel`.
- **Opacity transitions** on the overlay use Reanimated's `withTiming` (see §7.4); opacity on the children wrapper is static (plain RN style), not animated, since we flip it at commit-time aligned with overlay mount/unmount.

## 8. Error handling

### 8.1 Guiding principle

The library never crashes the consumer's app. Every failure degrades to "no skeleton shown, children rendered as if `loading=false`". Dev warnings surface the cause; production is silent.

### 8.2 Failure modes

| Scenario                                     | Detection                                  | Behavior                                                                                                         |
| -------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Old Architecture                             | `stateNode` lacks `measureLayout`          | Dev error with migration link; prod: render children unchanged                                                   |
| `__internalInstanceHandle` missing           | Null check after `onLayout`                | Dev warning (common cause: Modal/Portal or missing `collapsable={false}`); children render normally              |
| Single `measureLayout` fails                 | `onFail` or NaN rect                       | Drop that bone; warn with `typeName(fiber)`                                                                      |
| Container unmounts mid-measurement           | `containerRef.current === null` at resolve | Discard result silently                                                                                          |
| Suspense boundary inside children            | Walked as committed                        | Works — we measure whatever is actually committed. Docs recommend not wrapping Suspense you don't want shimmered |
| Empty bone list after walk                   | `bones.length === 0`                       | Skip overlay; dev warning suggesting transparent-only subtree                                                    |
| `classify` throws                            | Try/catch in walker                        | Fall back to default for that node; warn once                                                                    |
| `refineBones` throws                         | Try/catch around pipeline step             | Use pre-refined tree; warn once                                                                                  |
| `renderBone` throws for one bone             | Error boundary around overlay              | Use default `<Bone>` for that bone; other bones unaffected                                                       |
| Corrupt tree from `refineBones`              | Dev-mode schema validation                 | Use pre-refined tree; warn                                                                                       |
| Huge trees (>50 bones)                       | Timing log                                 | Dev hint: narrow scope via `classify`; no hard limit                                                             |
| Portal/Modal children                        | Their `stateNode` lives elsewhere          | Filtered out if rect falls outside container; info log                                                           |
| Fast load (<16ms)                            | `useDeferredValue` never commits           | No measurement, no render                                                                                        |
| Reduce Motion on                             | `ReduceMotion.System` on animations        | Gradient sits at middle position, still looks like loading                                                       |
| VoiceOver active                             | a11y props on overlay/children             | Announces "Loading"; mock data never announced                                                                   |
| Dynamic Type scaling                         | Measurement captures scaled rects          | No extra work                                                                                                    |
| Nested `<Skeleton>`                          | Each independent                           | Outer measures inner as one leaf (inner's root container); inner does its own thing                              |
| Inside virtualized list (FlashList/FlatList) | Cell recycling remounts                    | Acceptable; pipeline re-runs per mount; docs recommend one shimmer per row template with per-row instances       |

### 8.3 Warning budget

At most 5 distinct dev warnings, each at most once per Skeleton mount (guarded by a ref):

1. `[dynamic-shimmer] Fabric required. Enable the New Architecture.`
2. `[dynamic-shimmer] Container ref has no fiber instance. Is this inside a <Modal> or <Portal>?`
3. `[dynamic-shimmer] No bones found after walk. Your subtree may contain only transparent views.`
4. `[dynamic-shimmer] {hookName} threw: {error}. Falling back to default.`
5. `[dynamic-shimmer] Measurement pipeline exceeded {N}ms for {M} nodes.`

Each references `https://tychota.github.io/react-native-dynamic-shimmer/troubleshooting#warning-<n>` for deeper context.

### 8.4 Explicitly out of scope

- Web platform (`react-native-web`).
- Locale switching mid-animation.
- SSR.
- Image size-0-before-load special casing (drops zero-rects; consumer supplies explicit dims if needed).

## 9. Testing strategy

### 9.1 Test pyramid

| Layer                | Tool                  | Focus                                                             |
| -------------------- | --------------------- | ----------------------------------------------------------------- |
| Unit                 | Vitest                | Pure fns: walker, flattener, IR helpers, style math, worklets     |
| Component            | RTL + mocked Fabric   | Props, lifecycle, a11y, extension-hook invocation, error recovery |
| Visual (web-preview) | Storybook + Chromatic | Shimmer shapes, colors, bone layouts on `react-native-web`        |
| Visual (native)      | Maestro screenshots   | Real on-device shimmer rendering                                  |
| E2E                  | Maestro               | Golden paths in the example app                                   |
| Perf                 | Reassure              | Initial render, toggle re-renders, fiber-walk duration            |

### 9.2 Coverage targets

- Unit: 90% lines, 85% branches
- Component: 80% lines
- Visual: all documented Skeleton states
- E2E: 3 golden-path flows
- Perf: 5 committed baselines; regression threshold +20% fails CI

### 9.3 Unit tests (~80 tests, <500 ms)

Fixture helpers build minimal FiberNode-shaped trees for walker and classifier tests. Worklets call synchronously in Node via Reanimated's test mock. Tests cover every module in `fiber/`, `measure/`, `ir/`, `animation/`, `visibility/`.

### 9.4 Component tests (~33 tests)

Shared setup mocks `platform/fabric.ts` with a scripted measurement registry and `expo-linear-gradient` with a stub View. Tests cover:

- Rendering logic (children visibility, overlay mount/unmount)
- Visibility (debounce, sticky, transition fade)
- Extension hooks (invocation, fallback on throw)
- Accessibility (roles, state, hidden content)
- Observability (`onMeasured`)

### 9.5 Visual regression

`.storybook/` with `@storybook/react-native-web-vite`. Stories cover: Default, Pulse, NoAnimation, DarkMode, LongText, SmallScreen, WithCustomBone, MergedBones, ContainerWithBorderRadius, Loaded, Transitioning, ReducedMotion. Chromatic diffs against baselines in CI; PRs blocked on unapproved visual changes. Native visual is verified via Maestro screenshots in `apps/example/.maestro/visual/`.

### 9.6 E2E (Maestro Cloud)

Three YAML flows in `apps/example/.maestro/e2e/`:

- `happy-path.yaml` — open User Profile, see shimmer, wait, assert real content
- `pull-to-refresh.yaml` — trigger refresh, see shimmer, wait, assert
- `fast-load.yaml` — mock 20 ms response, assert shimmer never shown

### 9.7 Performance (Reassure)

Five committed baselines in `__perf__/baseline.json`:

| Scenario                           | Metric          | Target | Threshold |
| ---------------------------------- | --------------- | ------ | --------- |
| Skeleton w/ 10 bones, first render | ms              | ≤ 40   | +20%      |
| Skeleton w/ 30 bones, first render | ms              | ≤ 80   | +20%      |
| Skeleton loading toggle ×10        | re-render count | ≤ 25   | +30%      |
| Shimmer 5 s                        | JS frame drops  | 0      | >1 fails  |
| Fiber walk on 50-node tree         | ms              | ≤ 5    | +50%      |

Bundle size budget: **25 kB gzipped** for the library, enforced via `size-limit`.

### 9.8 CI run-time budget

PR CI: ~10 minutes (lint + typecheck + unit + component + build + size-limit + Reassure + Chromatic). Release CI: ~25 minutes (adds native iOS/Android builds and Maestro Cloud E2E both platforms).

## 10. Repository structure and CI

### 10.1 Top-level tree

```
theodo-skeleton/
├── .changeset/
├── .github/
│   ├── CODEOWNERS
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── ci.yml
│       ├── chromatic.yml
│       ├── example.yml
│       ├── release.yml
│       └── docs.yml
├── .husky/pre-commit
├── .vscode/
├── apps/example/
├── docs/                                 # Astro Starlight
├── packages/react-native-dynamic-shimmer/
├── .editorconfig
├── .node-version                         # 20.14.0
├── .npmrc
├── .nvmrc
├── LICENSE                               # MIT
├── README.md
├── mise.toml                             # Node + pnpm pin
├── oxlint.config.ts
├── oxfmt.config.jsonc                    # only if defaults insufficient
├── package.json                          # workspace root
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### 10.2 Workspace root `package.json`

```jsonc
{
  "name": "rn-dynamic-shimmer-monorepo",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.0",
  "engines": { "node": ">=20.14.0" },
  "scripts": {
    "build": "pnpm -r --filter \"./packages/*\" run build",
    "typecheck": "pnpm -r run typecheck",
    "lint": "oxlint --type-aware .",
    "lint:fix": "oxlint --type-aware --fix .",
    "format": "oxfmt --write .",
    "format:check": "oxfmt --check .",
    "test": "pnpm -r run test",
    "test:unit": "pnpm --filter react-native-dynamic-shimmer test:unit",
    "test:component": "pnpm --filter react-native-dynamic-shimmer test:component",
    "test:perf": "pnpm --filter react-native-dynamic-shimmer test:perf",
    "storybook": "pnpm --filter react-native-dynamic-shimmer storybook",
    "chromatic": "pnpm --filter react-native-dynamic-shimmer chromatic",
    "docs:dev": "pnpm --filter rn-dynamic-shimmer-docs dev",
    "docs:build": "pnpm --filter rn-dynamic-shimmer-docs build",
    "example:ios": "pnpm --filter rn-dynamic-shimmer-example ios",
    "example:android": "pnpm --filter rn-dynamic-shimmer-example android",
    "changeset": "changeset",
    "release": "changeset publish",
    "prepare": "husky",
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^22.10.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.3.0",
    "oxfmt": "^0.40.0",
    "oxlint": "^1.50.0",
    "oxlint-tsgolint": "^0.16.0",
    "typescript": "^5.8.0",
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,md,mdx}": ["oxfmt --write", "oxlint --type-aware --fix"],
  },
}
```

### 10.3 `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "docs"
```

### 10.4 `.npmrc`

```ini
public-hoist-pattern[]=*react-native*
public-hoist-pattern[]=*expo*
public-hoist-pattern[]=@react-native/*
strict-peer-dependencies=false
shamefully-hoist=false
```

### 10.5 `tsconfig.base.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
  },
}
```

### 10.6 Library `package.json` shape

```jsonc
{
  "name": "react-native-dynamic-shimmer",
  "version": "0.1.0",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "react-native": "./src/index.ts",
  "exports": {
    ".": {
      "react-native": "./src/index.ts",
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs",
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs",
      },
    },
  },
  "files": ["dist", "src", "LICENSE", "README.md"],
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-native": ">=0.76.0",
    "react-native-reanimated": ">=3.17.0",
    "expo-linear-gradient": ">=15.0.0",
  },
}
```

### 10.7 CI workflows

- **`ci.yml`** — runs on every PR and on push to `main`. Lint, format-check, typecheck, unit, component, build, size-limit, Reassure. Ubuntu. ~10 minutes.
- **`chromatic.yml`** — Storybook build + Chromatic visual diff. Required status check on `main`.
- **`example.yml`** — iOS (macos-14) and Android (ubuntu) native builds; Maestro Cloud E2E. Runs on PRs touching the library or example, weekly on Monday, and on workflow_dispatch.
- **`release.yml`** — changesets publish to npm with OIDC provenance on merge to `main`.
- **`docs.yml`** — builds and deploys the Starlight site to GitHub Pages on changes under `docs/`.

### 10.8 Required GitHub settings

- Branch protection on `main`: PR required, 1 review, conversation resolution, required checks (`ci`, `perf`, `Chromatic`), linear history, no force-push.
- Secrets: `NPM_TOKEN`, `CHROMATIC_PROJECT_TOKEN`, `MAESTRO_CLOUD_API_KEY`.
- GitHub Pages enabled with Actions deployment.
- Discussions enabled.

## 11. Example app

### 11.1 Purpose

Three audiences:

1. New users — the live demo for docs/GitHub.
2. Docs recipes — each recipe in `docs/src/content/docs/recipes/` links to one screen.
3. CI — Maestro E2E and native-visual flows drive this app.

Not a kitchen-sink playground. Each screen demonstrates one use case.

### 11.2 Stack

- Expo SDK 55 (new arch, Hermes)
- expo-router
- React 19 with the compiler enabled
- Reanimated 3.17+
- Unistyles 3
- @tanstack/react-query v5
- expo-image, @shopify/flash-list
- `"react-native-dynamic-shimmer": "workspace:*"`

### 11.3 Screens (12)

**Basics:** profile-card, user-list (FlashList of 20), dark-mode. **Timing:** fast-load (20 ms, skeleton should not appear), slow-load (3 s), error-state. **Layout:** long-text (multi-line wrapping), breakpoints (280/375/560 px via Unistyles). **Extension:** custom-bone (BlurView), refine-bones-merge, refine-bones-hide, classify (custom leaf for `IconBadge`).

Each screen proves one library property. Maestro screenshot flows point to screens at deterministic delay/error scenarios controlled via URL query params.

### 11.4 Mock data

`src/mocks/api.ts` exposes `fetchUser(id, config?)`, `fetchUserList(config?)`, `fetchFeed(config?)` with configurable `delayMs` and `failAfterMs`. `useControlledQuery` wraps React Query and reads URL params so Maestro scenarios drive the app without recompilation.

### 11.5 Theme integration

`src/theme/unistyles.ts` configures Unistyles 3 themes (`light` / `dark`) and breakpoints (`xs`, `sm`, `md`, `lg`). Skeleton colors come from `theme.colors.skeletonBase` / `.skeletonHighlight`. This pattern is the canonical "dark-mode-unistyles" recipe in the docs.

### 11.6 Build config

- `babel.config.js`: `babel-preset-expo`, `babel-plugin-react-compiler`, `react-native-worklets/plugin` (last).
- `metro.config.js`: standard Expo monorepo setup with `watchFolders: [workspaceRoot]`, `disableHierarchicalLookup: true`.

## 12. Documentation site

Astro Starlight at `docs/`. Sections:

- **Getting started.** Install, peer deps, minimum RN + React version, one working example.
- **Usage.** Common patterns (optimistic, stale-while-revalidate, staying shown during refresh).
- **API reference.** Full `SkeletonProps`, types, helper functions.
- **Theory.** Why this design — Yoga layout, Fabric JSI measurement, accessibility, React Compiler compat.
- **Extension.** Five sub-pages — colors, animation, render-bone, classify, refine-bones — each with runnable examples.
- **Recipes.** List rows, pull-to-refresh, dark-mode-unistyles, custom-bone-blur.
- **Troubleshooting.** Each dev warning explained with cause + fix.
- **Credits.** Nicușor Cîciudan's blog post (original blog-post lineage) and Boneyard (the fiber-walker pattern and IR vocabulary).

Site deploys to `https://tychota.github.io/react-native-dynamic-shimmer` via `docs.yml`.

## 13. Release and governance

- **Versioning:** Semantic. 0.x until the API is battle-tested in at least one real app; 1.0 after.
- **Release cadence:** On-demand via changesets. No fixed cadence.
- **Breaking changes:** Major-version only. Deprecation warnings for one minor cycle before removal.
- **Security:** `npm provenance` on every publish. `dependabot.yml` watches peer deps + dev tools.
- **Contributions:** Open PRs with a changeset. CONTRIBUTING.md explains the workflow. Code of Conduct: Contributor Covenant.

## 14. Open questions / future work

- **Piecewise-linear fallback.** Shipped for v1 runtime-only. Revisit if a consumer asks for offline/pre-computed bones — would be additive (`<SkeletonStatic bones={...}>`), not a change to v1.
- **More animations.** `'wave'` (radial) is out of v1 scope. Consumers can implement via `renderBone`. Revisit if there's repeat demand.
- **Web platform.** Not tested. If demand materializes, could be added as a separate export condition — but needs its own visual regression coverage.
- **Runtime-measurement caching.** Across same-key mounts, cache last-measured bones. ~50 lines. Future optimization, not needed at launch.

## 15. Credits

- **[Nicușor Cîciudan — "Let's build dynamic shimmer skeletons"](https://neciudan.dev/lets-build-dynamic-shimmer-skeletons)** — the original blog post. Every design decision here starts from the insight that "the real component IS the skeleton." Our contribution is adapting the pattern to Fabric and the New Architecture, where synchronous JSI measurement makes build-time scanning unnecessary.
- **[`0xGF/boneyard`](https://github.com/0xGF/boneyard)** — the fiber-walker pattern (`__internalInstanceHandle`, classification via fiber tag + type name), the bone IR concept, and the practice of flagging visually-distinctive containers as their own bones. We keep their fiber-walking approach for its simplicity, replace their build-time scan with runtime measurement, and introduce a user-facing IR with helpers (`walk` / `find` / `hide` / `merge`) that their codebase doesn't expose.
