# Expo upgrade plan — within SDK 55

> Captured from `pnpm dlx expo-doctor` run on 2026-05-14 against the example app at `apps/example/`.

**Goal:** Bring `apps/example/` into full alignment with the versions Expo SDK 55 currently expects, fixing both the missing peer dependency that expo-doctor flagged and the 13 minor/patch version drifts.

**Architecture:** Stay on SDK 55 — no major engine bump. The drift is purely accumulated patch releases of expo packages + a few minor releases of unimoduled React Native peers. Single `expo install --check` run can land them all coherently.

**Tech stack:** Expo SDK 55, React Native 0.83.6, React 19.2.x, Reanimated 4.2.1, Worklets 0.7.4 (the last two pinned in `pnpm.overrides`).

---

## What expo-doctor found

**16/18 checks passed.** Two failures:

### 1. Missing peer dependency

```
expo-constants  → required by expo-router (and several other modules)
```

The app's `package.json` doesn't depend on `expo-constants` directly. It works in dev because pnpm hoists transitive deps within the workspace and expo-router pulls it transitively, but on a fresh isolated install (or once Expo Go is gone) the app would crash on the first `Constants.expoConfig` read. Adding it as a direct dep makes the dependency explicit and stable.

### 2. Version drift inside SDK 55

The lockfile resolved newer patches than what `expo install` would pin today. Nothing is wrong — pnpm simply resolved the latest within the semver range each package allowed. expo-doctor's contract is that the SDK should be a single coherent matrix; sliding off by 13 patches makes regression triage harder.

**Minor mismatches (4):**

| package | current | SDK 55 expects |
|---|---|---|
| `@shopify/flash-list` | 2.3.1 | 2.0.2 |
| `react-native-gesture-handler` | 2.31.1 | ~2.30.0 |
| `react-native-safe-area-context` | 5.7.0 | ~5.6.2 |
| `react-native-screens` | 4.24.0 | ~4.23.0 |

**Patch mismatches (9):**

| package | current | SDK 55 expects |
|---|---|---|
| `@expo/metro-runtime` | 55.0.10 | ~55.0.11 |
| `expo` | 55.0.17 | ~55.0.24 |
| `expo-build-properties` | 55.0.13 | ~55.0.14 |
| `expo-image` | 55.0.9 | ~55.0.10 |
| `expo-linear-gradient` | 55.0.13 | ~55.0.14 |
| `expo-linking` | 55.0.14 | ~55.0.15 |
| `expo-router` | 55.0.13 | ~55.0.14 |
| `expo-status-bar` | 55.0.5 | ~55.0.6 |
| `react` | 19.2.5 | 19.2.0 (pinned) |

The `react` flag is interesting — Expo SDK 55 pins React to exactly 19.2.0, but our root has resolved 19.2.5 (the latest patch). Since we use React patches across the monorepo (docs site, Storybook), bumping it down may break those. The other 12 are straightforward Expo-side updates.

---

## File structure this plan touches

```
apps/example/
├── package.json                # add expo-constants, bump 12 packages
└── pnpm-lock.yaml              # regenerated

# No code changes expected — these are all internal version bumps within SDK 55.
```

---

## Phase 1 — Add the missing peer

### Task 1: Install `expo-constants` as a direct dep

**Files:**

- Modify: `apps/example/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install via the official command**

Run: `pnpm --filter rn-fabric-shimmer-example exec npx expo install expo-constants`
Expected: `expo-constants@~17.x.x` added to dependencies, pnpm lockfile updated.

- [ ] **Step 2: Verify expo-doctor no longer reports the missing peer**

Run: `pnpm --filter rn-fabric-shimmer-example exec pnpm dlx expo-doctor`
Expected: the "Missing peer dependency: expo-constants" check now passes (still 1 check failed for version drift).

- [ ] **Step 3: Run the example app and confirm nothing regressed**

Run: `pnpm --filter rn-fabric-shimmer-example ios`
Expected: app boots, Profile-card / Fast-load / Slow-load demos behave as before. The existing maestro/e2e/happy-path.yaml flow runs locally.

- [ ] **Step 4: Commit**

```bash
git add apps/example/package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
fix(example): add expo-constants as a direct dependency

Required transitively by expo-router and surfaced by expo-doctor.
Hoisting was masking it in dev; declaring it explicitly prevents
crashes on isolated installs.
EOF
)"
```

---

## Phase 2 — Align all packages to SDK 55's expected versions

### Task 2: Run `expo install --check`

**Files:**

- Modify: `apps/example/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Apply Expo's recommended versions**

Run: `pnpm --filter rn-fabric-shimmer-example exec npx expo install --check`
Expected: interactive prompt listing the 13 packages. Accept all updates.

- [ ] **Step 2: Decide what to do about the React pin**

Expo SDK 55 pins React to exactly `19.2.0`, but the monorepo's docs + Storybook + the library all use `^19.2.0` (currently resolved to 19.2.5). Two options:

  a. **Pin React across the workspace to 19.2.0** — adds `"react": "19.2.0"` to root `pnpm.overrides`. Matches Expo's contract. Drops a few React patches.

  b. **Override Expo's pin** — keep React at 19.2.5 and add `"expo.install.exclude": ["react"]` to `apps/example/package.json` so expo-doctor stops flagging it. Acknowledges drift but stays on a newer React.

Recommended: **option (a)**. Patch-level React divergence between apps inside one workspace is a common debugging trap (different concurrent-features behaviour on the same code).

- [ ] **Step 3: Run the full local CI suite**

Run: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm --filter react-native-fabric-shimmer build && pnpm --filter react-native-fabric-shimmer size`
Expected: all gates green.

- [ ] **Step 4: Re-run expo-doctor**

Run: `pnpm --filter rn-fabric-shimmer-example exec pnpm dlx expo-doctor`
Expected: 18/18 checks pass.

- [ ] **Step 5: Native rebuild + smoke**

Run: `pnpm --filter rn-fabric-shimmer-example prebuild:ios && pnpm --filter rn-fabric-shimmer-example ios`
Expected: app rebuilds against the new native module versions. The shimmer rendering and bone capture work end-to-end (no API surface changed in these patches).

- [ ] **Step 6: Commit**

```bash
git add apps/example/package.json pnpm-lock.yaml package.json
git commit -m "$(cat <<'EOF'
chore(example): align with Expo SDK 55 expected versions

Run `expo install --check` and accept all 13 patch/minor bumps.
Pin React to 19.2.0 across the workspace via pnpm.overrides so the
example app, docs, Storybook, and library all reconcile to the
same React patch — same reason Reanimated + Worklets are pinned.

Largest deltas:
  expo            55.0.17 → 55.0.24
  expo-router     55.0.13 → 55.0.14
  expo-image      55.0.9  → 55.0.10
  flash-list      2.3.1   → 2.0.2  (downgrade — SDK 55 pinned the older line)

All within SDK 55 — no SDK upgrade implied.
EOF
)"
```

---

## Phase 3 — Defer: actual SDK upgrade (SDK 55 → SDK 56)

**Not in this plan.** SDK 56 introduces:

- React Native 0.84 (Fabric default true; some legacy bridge APIs removed)
- React 19.3 (compiler updates, possible behaviour change in concurrent rendering)
- New `expo-modules-autolinking` major

When SDK 56 lands as a stable release, write a separate plan that:

1. Verifies the library still measures correctly under RN 0.84 (Fabric `stateNode` shape has been stable across 0.76 → 0.83 but a 0.84 surprise is plausible).
2. Reruns the Reassure perf baseline — RN minor bumps tend to shift render times by 10–30 %.
3. Updates the docs/theory/fabric-jsi.mdx page if any of its claims become stale.
4. Walks the example app through one full demo to catch any breaking API in expo-router or flash-list.

---

## Self-review

**Spec coverage:** Both expo-doctor failures (missing peer, version drift) have a task. React pin decision is explicit. SDK 56 is explicitly out of scope.

**Type/version consistency:** All version numbers come from expo-doctor's "expected" column.

**Risks called out:** React downgrade across the workspace is the largest behavioural risk. Native rebuild is required after the package bumps.

---

## Execution handoff

Run Phase 1 in one sitting; verify nothing regressed in the example app. Run Phase 2 in a separate session because it touches 13 packages — easier to bisect if anything breaks. After both phases land, expo-doctor reports 18/18 and the example app is back on the SDK 55 reference matrix.
