## Summary

<What this changes and why.>

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Docs only
- [ ] Refactor / chore

## Checklist

- [ ] Tests added or updated
- [ ] Changeset added (`pnpm changeset`) if user-visible
- [ ] Docs updated if API surface changed
- [ ] `pnpm lint && pnpm typecheck && pnpm test` passes locally

## New dependency? (skip if no `pnpm add`)

- [ ] Reviewed maintenance status, weekly downloads, last-release age (e.g. on socket.dev, npmjs.com)
- [ ] Checked for open critical CVEs (`pnpm audit`, `npm audit`, or socket.dev)
- [ ] For high-risk deps (postinstall scripts, native bindings, very fresh package, single maintainer): inspected the published tarball via `npm pack <name>@<version>` and skimmed contents
- [ ] Confirmed `pnpm install` still respects `minimumReleaseAge` — i.e. didn't pull a < 72h-old release of any transitive
