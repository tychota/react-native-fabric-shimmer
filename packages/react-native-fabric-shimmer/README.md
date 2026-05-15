# react-native-fabric-shimmer

Dynamic skeletons for React Native Fabric. The loading state is made from your real component: render it with realistic placeholder data, let Fabric report the native layout, and paint shimmer bones at the measured positions.

- No build-time scanner, CLI, or hand-written bone JSON.
- Fabric/New Architecture only: React Native 0.76+.
- React 19+, Reanimated 4+, and `expo-linear-gradient` 15+.
- Extension points for colors, animation, per-bone rendering, classification, and IR refinement.
- React Compiler-friendly default bone renderer.

Docs: https://tychota.github.io/react-native-fabric-shimmer

## Install

```sh
pnpm add react-native-fabric-shimmer react-native-reanimated expo-linear-gradient
```

For Expo SDK 55, those peer versions are already aligned with the SDK matrix. Reanimated's worklet plugin still needs to be configured in your app.

## Minimal Usage

```tsx
import { Skeleton } from "react-native-fabric-shimmer";

const PLACEHOLDER_USER = {
  id: "loading",
  name: "Ada Lovelace",
  role: "Computing pioneer",
  avatarUrl: "https://example.com/avatar.png",
};

export function Profile({ user }: { user?: User }) {
  return (
    <Skeleton loading={user === undefined} baseColor="#e4e4e7" highlightColor="#f4f4f5">
      <UserCard user={user ?? PLACEHOLDER_USER} />
    </Skeleton>
  );
}
```

The child remains mounted while loading, but it is hidden from sight and accessibility. The overlay becomes a progressbar with the default label `"Loading"`.

## Shape the Bones

```tsx
import { Skeleton, find, hide } from "react-native-fabric-shimmer";

<Skeleton
  loading={!user}
  baseColor={theme.skeletonBase}
  highlightColor={theme.skeletonHighlight}
  refineBones={(tree) => {
    const chevron = find(tree, (node) => node.type === "Chevron");
    return chevron ? hide(tree, chevron) : tree;
  }}
>
  <UserCard user={user ?? PLACEHOLDER_USER} />
</Skeleton>;
```

Use `classify` when the default fiber classifier misses a custom native surface. Use `renderBone` when one measured rect needs a different visual treatment. Use `refineBones` when the measured tree is correct but the loading shape should be calmer, merged, or hidden.

## Debug Measurement

```tsx
import { Skeleton, dumpTree } from "react-native-fabric-shimmer";

<Skeleton
  loading
  baseColor="#e4e4e7"
  highlightColor="#f4f4f5"
  onMeasured={(_bones, tree) => console.log(dumpTree(tree))}
>
  <UserCard user={PLACEHOLDER_USER} />
</Skeleton>;
```

`dumpTree` prints the measured `BoneNode` tree with type, classification, and rect information. It is the quickest way to tune `classify` and `refineBones`.

## Platform Contract

Runtime measurement requires React Native Fabric. React Native Web, Storybook, and Chromatic can show deterministic visual fixtures, but they do not exercise `nativeFabricUIManager.measureLayout`. Use the native example app and Maestro flows to validate real behavior.

## Credits

- [Nicușor Cîciudan - "Let's build dynamic shimmer skeletons"](https://neciudan.dev/lets-build-dynamic-shimmer-skeletons), for the original "real component is the skeleton" pattern.
- [`0xGF/boneyard`](https://github.com/0xGF/boneyard), for the fiber walker and bone IR inspiration.

This package adapts those ideas for Fabric, React 19, Reanimated 4, and a public IR extension surface.

## License

MIT - see [LICENSE](./LICENSE).
