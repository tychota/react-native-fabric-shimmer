---
"react-native-fabric-shimmer": major
---

Two changes shipping together: a small but breaking API refactor on `<Bone>` for React Compiler memoization, plus a refresh of the default bone visuals.

**Breaking — `<Bone>` props are now flat scalars** (no nested `ctx` object).

```tsx
// Before
<Bone rect={rect} ctx={ctx} />

// After
<Bone
  rect={rect}
  progress={ctx.progress}
  baseColor={ctx.baseColor}
  highlightColor={ctx.highlightColor}
  animation={ctx.animation}
/>
```

The `BoneContext` type is still exported and is still what `renderBone(rect, ctx)` callbacks receive — only `<Bone>`'s own surface changed. The reason: when `Skeleton` rebuilt `ctx` inline inside its `bones.map` callback on every render, every Bone re-ran on every Skeleton re-render because React Compiler couldn't deduplicate a freshly-constructed object literal. Flat scalar props let the Compiler skip the Bone body when nothing bone-relevant has changed — visible as a measured 3.4 ms / 50-skeleton commit dropping to ~0 in the React DevTools Profiler.

**Visual refinement of the default bone** — same shape and behaviour, calmer execution.

- Shimmer bar widened from 40% to 58% of the bone, with cubic ease-in-out on the sweep so the highlight enters and leaves gently rather than popping. Stagger between neighbours softened so the wave still travels across the card without visibly cascading.
- Pulse curve replaced the linear triangle wave with a cosine wave between 0.62 and 1. The trough is smooth (no peak), and the loop seam is at opacity 1 (both endpoints) so the cycle doesn't visibly restart.
- Cycle duration 1400 ms → 1500 ms.
- Container vs leaf rendering contract documented explicitly: containers render statically using the captured source styling (acting as the card's outline); only leaves animate.
- Example app palette (`apps/example/src/theme/tokens.ts`) now declares colours in OKLCH and converts to hex at module load via `culori`. RN 0.83's colour parser doesn't yet accept `oklch()` strings (queued for 0.84+); see docs/extension/colors for the recommended bridge.
