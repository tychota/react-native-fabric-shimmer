---
"react-native-fabric-shimmer": minor
---

Internal: align example app to Expo SDK 55's exact pinned matrix; pin React + React Native in the workspace overrides to match.

No public API changes. The library code is unchanged from v0.1.0 — this release exists to lock down the development matrix so the example app, docs, and Storybook all reconcile to the same React patch (19.2.0) and React Native patch (0.83.6), eliminating per-workspace duplicate-package warnings from `expo-doctor`. Library devDep `expo-linear-gradient` bumped from `^55.0.13` to `~55.0.14` (the version SDK 55 currently pins).

The example app uses `~` ranges for SDK 55 packages going forward so dependabot won't drift them out of the SDK matrix; Dependabot is configured to ignore `expo` non-major bumps, `react`/`react-dom` (workspace-pinned), and `react-native-reanimated`/`react-native-worklets` (RN 0.83 Fabric pins). Vitest major bumps are also ignored — that migration is its own scoped effort.

Dev-tool refresh bundled in this release:

- `eslint-plugin-react-hooks` ^5.2.0 → ^7.1.1
- `oxfmt` ^0.40.0 → ^0.49.0
- `oxlint` ^1.50.0 → ^1.64.0
- `oxlint-tsgolint` ^0.21.0 → ^0.22.1
- `react-native-unistyles` ^3.0.0 → ^3.2.4 (example app)
