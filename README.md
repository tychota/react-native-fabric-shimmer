# react-native-fabric-shimmer

Dynamic skeletons for React Native Fabric. Wrap the real component, pass realistic loading data, and the library measures the native tree at runtime to paint shimmer bones in the same places.

## Workspace

- `packages/react-native-fabric-shimmer` - published npm package.
- `apps/example` - Expo SDK 55 native demo app with Fabric enabled.
- `docs` - Astro Starlight documentation site.
- `superpowers` - implementation plans and design notes.

## Local Checks

```sh
corepack enable
pnpm install

pnpm --filter react-native-fabric-shimmer build
pnpm --filter react-native-fabric-shimmer test
pnpm --filter react-native-fabric-shimmer package:check
pnpm typecheck
```

The toolchain is pinned in `mise.toml`: Node 24.15.0 and pnpm 11.1.1.

## Release Bar

Before publishing, `main` should have green package build, typecheck, unit/component tests, size limit, docs build, Storybook/Chromatic visual fixtures, and native example workflows. The web Storybook previews are deterministic visual fixtures; real measurement is a Fabric runtime feature and is validated through the native example app.

## License

MIT - © 2026 Tycho Tatitscheff.
