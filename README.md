# react-native-dynamic-shimmer — monorepo

Dynamic shimmer skeletons for React Native — the real component **is** the skeleton.

This repo contains:

- **`packages/react-native-dynamic-shimmer/`** — the library, published to npm as
  [`react-native-dynamic-shimmer`](https://www.npmjs.com/package/react-native-dynamic-shimmer).
- **`apps/example/`** — Expo demo app (Plan 2, not yet implemented).
- **`docs/`** — Astro Starlight documentation site (Plan 4, not yet implemented).

## Quick start

```sh
# Node 20 + pnpm 9 (see mise.toml / .nvmrc)
corepack enable
pnpm install

# Library
pnpm --filter react-native-dynamic-shimmer build
pnpm --filter react-native-dynamic-shimmer test
```

## Specs and plans

See `superpowers/specs/` and `superpowers/plans/` for the design doc
and implementation plans.

## License

MIT — © 2026 Tycho Tatitscheff.
