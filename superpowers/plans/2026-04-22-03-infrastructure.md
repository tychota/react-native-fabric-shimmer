# Plan 3 — Infrastructure (visual regression, E2E, CI, release)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire automated visual regression (Storybook + Chromatic), E2E + native-visual flows (Maestro), GitHub Actions CI + release pipelines, Reassure performance gate, size-limit bundle budget, and the first v0.1.0 publish.

**Architecture:** Storybook with `@storybook/react-native-web-vite` renders library states in a browser for Chromatic diffing. Maestro Cloud runs YAML flows on iOS + Android simulators. GitHub Actions orchestrates: PR CI (lint + typecheck + tests + build + Reassure + Chromatic) and release (changesets publish with npm provenance).

**Tech Stack:** Storybook 9, Chromatic, Maestro Cloud, `@callstack/reassure`, `size-limit`, `@changesets/action`, GitHub Actions on ubuntu-latest + macos-14.

**Prerequisites:** Plan 1 complete (library builds, tests pass). Plan 2 complete (example app runs on both platforms). Git remote `github.com/tychota/react-native-dynamic-shimmer` exists and is set as `origin`.

**Commit convention:** Same as earlier plans — conventional commits, `Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

---

## File structure this plan creates

```
.github/
├── CODEOWNERS
├── ISSUE_TEMPLATE/
│   ├── bug.yml
│   └── feature.yml
├── PULL_REQUEST_TEMPLATE.md
├── dependabot.yml
└── workflows/
    ├── ci.yml
    ├── chromatic.yml
    ├── example.yml
    └── release.yml

packages/react-native-dynamic-shimmer/
├── .storybook/
│   ├── main.ts
│   ├── preview.tsx
│   └── vite.config.ts
├── stories/
│   ├── Skeleton.stories.tsx
│   └── mock.ts
├── .size-limit.json
└── __perf__/
    ├── Skeleton.perf.tsx
    └── baseline.json

apps/example/.maestro/
├── e2e/
│   ├── happy-path.yaml
│   ├── fast-load.yaml
│   └── pull-to-refresh.yaml
└── visual/
    ├── profile-card.yaml
    └── loading-transition.yaml
```

---

# Phase 1 — Storybook + Chromatic

## Task 1: Install Storybook deps and scaffold config

**Files:**

- Create: `packages/react-native-dynamic-shimmer/.storybook/main.ts`
- Create: `packages/react-native-dynamic-shimmer/.storybook/preview.tsx`
- Create: `packages/react-native-dynamic-shimmer/.storybook/vite.config.ts`

- [ ] **Step 1: Install Storybook**

Run: `pnpm -F react-native-dynamic-shimmer add -D storybook@^9 @storybook/react-native-web-vite@^9 @storybook/addon-essentials@^9 chromatic react-native-web@^0.19 react-dom@^19 vite@^5`
Expected: lockfile updated.

- [ ] **Step 2: Create `.storybook/main.ts`**

```ts
import type { StorybookConfig } from "@storybook/react-native-web-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: { name: "@storybook/react-native-web-vite", options: {} },
  docs: { autodocs: "tag" },
  core: { disableTelemetry: true },
  viteFinal: (cfg) => ({
    ...cfg,
    resolve: {
      ...cfg.resolve,
      alias: {
        ...(cfg.resolve?.alias ?? {}),
        "react-native": "react-native-web",
        "react-native-reanimated": "react-native-reanimated/src/mock.ts",
        "expo-linear-gradient": "../.storybook/shims/LinearGradient.tsx",
      },
    },
  }),
};

export default config;
```

- [ ] **Step 3: Create `.storybook/preview.tsx`**

```tsx
import React from "react";
import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0b0b0f" },
      ],
    },
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360, fontFamily: "system-ui, sans-serif" }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

- [ ] **Step 4: Create `.storybook/shims/LinearGradient.tsx` (web shim)**

```tsx
import React from "react";

// Web-preview shim. Renders a CSS linear-gradient in place of the native component.
export function LinearGradient(props: {
  colors: ReadonlyArray<string>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: React.CSSProperties;
  children?: React.ReactNode;
}): React.ReactElement {
  const stops = props.colors.join(", ");
  const dx = (props.end?.x ?? 1) - (props.start?.x ?? 0);
  const dy = (props.end?.y ?? 0) - (props.start?.y ?? 0);
  const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90);
  return (
    <div style={{ ...props.style, backgroundImage: `linear-gradient(${angle}deg, ${stops})` }}>
      {props.children}
    </div>
  );
}
```

- [ ] **Step 5: Add storybook + chromatic scripts to the library's `package.json`**

Edit `packages/react-native-dynamic-shimmer/package.json` — add to scripts:

```jsonc
{
  "scripts": {
    // ...existing...
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build -o storybook-static",
    "chromatic": "chromatic --exit-zero-on-changes --only-changed",
  },
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/react-native-dynamic-shimmer/.storybook \
        packages/react-native-dynamic-shimmer/package.json \
        pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore(storybook): add RN-web Storybook scaffold + chromatic script

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Author Skeleton stories

**Files:**

- Create: `packages/react-native-dynamic-shimmer/stories/Skeleton.stories.tsx`
- Create: `packages/react-native-dynamic-shimmer/stories/mock.ts`

- [ ] **Step 1: Create `stories/mock.ts`**

```ts
export const MOCK_USER = {
  id: "1",
  name: "Alice Martin",
  role: "Product designer",
  bio: "Designs interfaces and the systems behind them. Loves typography.",
  avatarUrl: "https://i.pravatar.cc/112?img=1",
};

export const LONG_BIO_USER = {
  ...MOCK_USER,
  bio: Array(12).fill("Lorem ipsum dolor sit amet.").join(" "),
};

export const COLORS = {
  light: { base: "#e4e4e7", highlight: "#f4f4f5" },
  dark: { base: "#1f1f23", highlight: "#2a2a2f" },
};
```

- [ ] **Step 2: Create `stories/Skeleton.stories.tsx`**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { View, Text, Image } from "react-native";
import { Skeleton, Bone, find, findAll, hide, merge, type RenderBoneFn } from "../src";
import { MOCK_USER, LONG_BIO_USER, COLORS } from "./mock";

function UserCard({ user }: { user: typeof MOCK_USER }): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#fafafa",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        gap: 12,
      }}
    >
      <Image source={{ uri: user.avatarUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 17, fontWeight: "600" }}>{user.name}</Text>
        <Text style={{ fontSize: 13, color: "#6a6b72" }}>{user.role}</Text>
        <Text style={{ fontSize: 15 }}>{user.bio}</Text>
      </View>
    </View>
  );
}

const meta = {
  title: "Skeleton",
  component: Skeleton,
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Skeleton loading baseColor={COLORS.light.base} highlightColor={COLORS.light.highlight}>
      <UserCard user={MOCK_USER} />
    </Skeleton>
  ),
};

export const Pulse: Story = {
  render: () => (
    <Skeleton
      loading
      animation="pulse"
      baseColor={COLORS.light.base}
      highlightColor={COLORS.light.highlight}
    >
      <UserCard user={MOCK_USER} />
    </Skeleton>
  ),
};

export const NoAnimation: Story = {
  render: () => (
    <Skeleton
      loading
      animation="none"
      baseColor={COLORS.light.base}
      highlightColor={COLORS.light.highlight}
    >
      <UserCard user={MOCK_USER} />
    </Skeleton>
  ),
};

export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <Skeleton loading baseColor={COLORS.dark.base} highlightColor={COLORS.dark.highlight}>
      <UserCard user={MOCK_USER} />
    </Skeleton>
  ),
};

export const LongText: Story = {
  render: () => (
    <Skeleton loading baseColor={COLORS.light.base} highlightColor={COLORS.light.highlight}>
      <UserCard user={LONG_BIO_USER} />
    </Skeleton>
  ),
};

export const SmallScreen: Story = {
  render: () => (
    <View style={{ width: 280 }}>
      <Skeleton loading baseColor={COLORS.light.base} highlightColor={COLORS.light.highlight}>
        <UserCard user={MOCK_USER} />
      </Skeleton>
    </View>
  ),
};

const customRenderBone: RenderBoneFn = (rect, ctx) =>
  rect.kind === "image" ? (
    <View
      key={ctx.index}
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        borderRadius: rect.borderRadius === "50%" ? rect.width / 2 : rect.borderRadius,
        borderWidth: 2,
        borderColor: "#2b6cff",
        backgroundColor: "#fafafa",
      }}
    />
  ) : (
    <Bone key={ctx.index} rect={rect} ctx={ctx} />
  );

export const WithCustomBone: Story = {
  render: () => (
    <Skeleton
      loading
      baseColor={COLORS.light.base}
      highlightColor={COLORS.light.highlight}
      renderBone={customRenderBone}
    >
      <UserCard user={MOCK_USER} />
    </Skeleton>
  ),
};

export const MergedBones: Story = {
  render: () => (
    <Skeleton
      loading
      baseColor={COLORS.light.base}
      highlightColor={COLORS.light.highlight}
      refineBones={(tree) => {
        const texts = findAll(tree, (n) => n.type === "RCTText" && n.rect.y < 60);
        return texts.length >= 2 ? merge(tree, texts.slice(0, 2)) : tree;
      }}
    >
      <UserCard user={MOCK_USER} />
    </Skeleton>
  ),
};

export const Loaded: Story = {
  render: () => (
    <Skeleton loading={false} baseColor={COLORS.light.base} highlightColor={COLORS.light.highlight}>
      <UserCard user={MOCK_USER} />
    </Skeleton>
  ),
};
```

- [ ] **Step 3: Run Storybook locally**

Run: `pnpm --filter react-native-dynamic-shimmer storybook`
Expected: serves at `http://localhost:6006`; all 9 stories render without runtime errors.

- [ ] **Step 4: Commit**

```bash
git add packages/react-native-dynamic-shimmer/stories
git commit -m "$(cat <<'EOF'
feat(stories): add Skeleton stories covering 9 visual states

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Chromatic GitHub Action

**Files:**

- Create: `.github/workflows/chromatic.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: Chromatic
on:
  pull_request:
  push:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Chromatic needs full history for baseline detection
      - uses: jdx/mise-action@v2
      - run: corepack enable
      - uses: actions/cache@v4
        with:
          path: ~/.local/share/pnpm/store
          key: pnpm-${{ hashFiles('pnpm-lock.yaml') }}
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter react-native-dynamic-shimmer storybook:build
      - run: pnpm --filter react-native-dynamic-shimmer chromatic --storybook-build-dir storybook-static
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

- [ ] **Step 2: Obtain `CHROMATIC_PROJECT_TOKEN`**

1. Sign up at `https://www.chromatic.com/` and create a project linked to `tychota/react-native-dynamic-shimmer`.
2. Copy the project token.
3. In the GitHub repo settings → Secrets and variables → Actions, add `CHROMATIC_PROJECT_TOKEN`.

- [ ] **Step 3: Commit the workflow**

```bash
git add .github/workflows/chromatic.yml
git commit -m "$(cat <<'EOF'
ci: add Chromatic workflow for visual regression on PR and main

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 2 — Maestro E2E + native visual

## Task 4: E2E flows in the example app

**Files:**

- Create: `apps/example/.maestro/e2e/happy-path.yaml`
- Create: `apps/example/.maestro/e2e/fast-load.yaml`
- Create: `apps/example/.maestro/e2e/pull-to-refresh.yaml`

- [ ] **Step 1: Create `happy-path.yaml`**

```yaml
appId: com.theodoskeleton.shimmerexample
---
- launchApp
- tapOn: "Profile card"
- assertVisible:
    id: "Loading"
- waitUntilVisible:
    text: "Alice Martin"
    timeout: 6000
- assertNotVisible:
    id: "Loading"
```

- [ ] **Step 2: Create `fast-load.yaml`**

The fast-load demo has a 20 ms delay by default. Maestro asserts the Loading role is never visible.

```yaml
appId: com.theodoskeleton.shimmerexample
---
- launchApp
- tapOn: "Fast load (20ms)"
- waitUntilVisible:
    text: "Alice Martin"
    timeout: 3000
# By the time we can see the real text, the skeleton should be gone.
- assertNotVisible:
    id: "Loading"
```

- [ ] **Step 3: Create `pull-to-refresh.yaml`**

Trigger a refetch by navigating away and back; verifies that re-entering loading shows the skeleton again.

```yaml
appId: com.theodoskeleton.shimmerexample
---
- launchApp
- tapOn: "Profile card"
- waitUntilVisible:
    text: "Alice Martin"
    timeout: 6000
- back
- tapOn: "Profile card"
- assertVisible:
    id: "Loading"
```

- [ ] **Step 4: Ensure the app's `app.config.ts` sets the bundle id to match Maestro**

Edit `apps/example/app.config.ts` — add `ios.bundleIdentifier` and `android.package`:

```ts
const config: ExpoConfig = {
  // ...existing fields...
  ios: { bundleIdentifier: "com.theodoskeleton.shimmerexample" },
  android: { package: "com.theodoskeleton.shimmerexample" },
};
```

- [ ] **Step 5: Run one flow locally (requires Maestro CLI)**

Run: `pnpm example:ios` and wait for the app to install, then in another terminal:

Run: `maestro test apps/example/.maestro/e2e/happy-path.yaml`
Expected: flow passes.

- [ ] **Step 6: Commit**

```bash
git add apps/example/.maestro/e2e apps/example/app.config.ts
git commit -m "$(cat <<'EOF'
test(example): add Maestro e2e flows and pin bundle id

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Maestro native-visual flows and screenshot diff script

**Files:**

- Create: `apps/example/.maestro/visual/profile-card.yaml`
- Create: `apps/example/.maestro/visual/loading-transition.yaml`
- Create: `scripts/diff-screenshots.mjs`

- [ ] **Step 1: Create `visual/profile-card.yaml`**

```yaml
appId: com.theodoskeleton.shimmerexample
---
- launchApp
- tapOn: "Profile card"
- waitFor:
    timeout: 500
- takeScreenshot:
    path: apps/example/.maestro/screenshots/profile-card-shimmer
- waitUntilVisible:
    text: "Alice Martin"
    timeout: 6000
- takeScreenshot:
    path: apps/example/.maestro/screenshots/profile-card-loaded
```

- [ ] **Step 2: Create `visual/loading-transition.yaml`**

```yaml
appId: com.theodoskeleton.shimmerexample
---
- launchApp
- tapOn: "Slow load (3s)"
- waitFor:
    timeout: 300
- takeScreenshot:
    path: apps/example/.maestro/screenshots/transition-t300
- waitFor:
    timeout: 1500
- takeScreenshot:
    path: apps/example/.maestro/screenshots/transition-t1800
```

- [ ] **Step 3: Create `scripts/diff-screenshots.mjs`**

```js
#!/usr/bin/env node
import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { readFileSync, writeFileSync } from "node:fs";

const baselineDir = resolve("apps/example/.maestro/screenshots/baseline");
const currentDir = resolve("apps/example/.maestro/screenshots");
const diffDir = resolve("apps/example/.maestro/screenshots/diff");

if (!existsSync(baselineDir)) {
  console.log("No baseline yet — treat current screenshots as new baseline.");
  process.exit(0);
}

let failed = 0;
for (const file of readdirSync(baselineDir)) {
  if (!file.endsWith(".png")) continue;
  const a = PNG.sync.read(readFileSync(resolve(baselineDir, file)));
  const bPath = resolve(currentDir, file);
  if (!existsSync(bPath)) {
    console.warn(`Missing current screenshot: ${file}`);
    failed++;
    continue;
  }
  const b = PNG.sync.read(readFileSync(bPath));
  if (a.width !== b.width || a.height !== b.height) {
    console.warn(`Size mismatch for ${file}`);
    failed++;
    continue;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const mismatches = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  if (mismatches > a.width * a.height * 0.005) {
    writeFileSync(resolve(diffDir, file), PNG.sync.write(diff));
    console.warn(`Visual diff: ${file} (${mismatches} px)`);
    failed++;
  }
}
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 4: Install `pngjs` and `pixelmatch`**

Run: `pnpm -w add -D pngjs pixelmatch`
Expected: added to workspace root.

- [ ] **Step 5: Commit**

```bash
git add apps/example/.maestro/visual scripts/diff-screenshots.mjs package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
test(visual): add Maestro screenshot flows and pixelmatch diff script

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 3 — Reassure performance + size-limit

## Task 6: Reassure baseline and CI action

**Files:**

- Create: `packages/react-native-dynamic-shimmer/__perf__/Skeleton.perf.tsx`
- Create: `packages/react-native-dynamic-shimmer/__perf__/baseline.json` (empty placeholder; generated by first run)

- [ ] **Step 1: Install Reassure**

Run: `pnpm -F react-native-dynamic-shimmer add -D @callstack/reassure react-native-testing-library-reassure@^0.10.0`
Expected: lockfile updated.

- [ ] **Step 2: Add Reassure script to the library `package.json`**

Edit `packages/react-native-dynamic-shimmer/package.json` — scripts:

```jsonc
{
  "scripts": {
    // ...
    "test:perf": "reassure",
  },
}
```

- [ ] **Step 3: Create the perf test — `__perf__/Skeleton.perf.tsx`**

```tsx
import React from "react";
import { View, Text } from "react-native";
import { measurePerformance } from "@callstack/reassure";
import { Skeleton } from "../src/Skeleton";

function Card({ n }: { n: number }): React.ReactElement {
  return (
    <View>
      {Array(n)
        .fill(null)
        .map((_, i) => (
          <Text key={i}>Text line {i}</Text>
        ))}
    </View>
  );
}

test("Skeleton — 10 bones initial render", async () => {
  await measurePerformance(
    <Skeleton loading baseColor="#eee" highlightColor="#fff">
      <Card n={10} />
    </Skeleton>,
  );
});

test("Skeleton — 30 bones initial render", async () => {
  await measurePerformance(
    <Skeleton loading baseColor="#eee" highlightColor="#fff">
      <Card n={30} />
    </Skeleton>,
  );
});
```

- [ ] **Step 4: Run Reassure once to produce a baseline**

Run: `pnpm --filter react-native-dynamic-shimmer test:perf`
Expected: produces `.reassure/output.json`. Commit the current output as `__perf__/baseline.json`:

Run: `cp packages/react-native-dynamic-shimmer/.reassure/output.json packages/react-native-dynamic-shimmer/__perf__/baseline.json`

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/__perf__ \
        packages/react-native-dynamic-shimmer/package.json \
        pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
test(perf): add Reassure baselines for 10- and 30-bone Skeleton

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Bundle size budget via size-limit

**Files:**

- Create: `packages/react-native-dynamic-shimmer/.size-limit.json`

- [ ] **Step 1: Install size-limit**

Run: `pnpm -F react-native-dynamic-shimmer add -D size-limit @size-limit/preset-small-lib`
Expected: lockfile updated.

- [ ] **Step 2: Create `.size-limit.json`**

```json
[
  {
    "name": "ESM",
    "path": "dist/index.mjs",
    "limit": "25 kB",
    "gzip": true,
    "brotli": false
  },
  {
    "name": "CJS",
    "path": "dist/index.cjs",
    "limit": "28 kB",
    "gzip": true,
    "brotli": false
  }
]
```

- [ ] **Step 3: Add script**

Edit `packages/react-native-dynamic-shimmer/package.json` — scripts:

```jsonc
{
  "scripts": {
    // ...
    "size": "size-limit",
  },
}
```

- [ ] **Step 4: Run it**

Run: `pnpm --filter react-native-dynamic-shimmer build && pnpm --filter react-native-dynamic-shimmer size`
Expected: both entries under budget.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/.size-limit.json \
        packages/react-native-dynamic-shimmer/package.json \
        pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add size-limit budget (25 kB gzip ESM, 28 kB gzip CJS)

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 4 — GitHub Actions CI

## Task 8: Primary CI workflow

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: corepack enable
      - uses: actions/cache@v4
        with:
          path: ~/.local/share/pnpm/store
          key: pnpm-${{ hashFiles('pnpm-lock.yaml') }}
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm typecheck
      - run: pnpm --filter react-native-dynamic-shimmer test
      - run: pnpm --filter react-native-dynamic-shimmer build
      - run: pnpm --filter react-native-dynamic-shimmer size

  perf:
    runs-on: ubuntu-latest
    needs: gate
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: jdx/mise-action@v2
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter react-native-dynamic-shimmer test:perf
      - uses: callstack/reassure-action@v1
        with:
          working-directory: packages/react-native-dynamic-shimmer
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: add primary CI workflow (lint/typecheck/test/build/size/perf)

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Example app build + Maestro Cloud workflow

**Files:**

- Create: `.github/workflows/example.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: Example app
on:
  pull_request:
    paths:
      - "packages/react-native-dynamic-shimmer/**"
      - "apps/example/**"
      - ".github/workflows/example.yml"
  schedule:
    - cron: "0 6 * * 1"
  workflow_dispatch:

jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - uses: actions/setup-java@v4
        with: { distribution: "temurin", java-version: "17" }
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm -F react-native-dynamic-shimmer build
      - run: pnpm -F rn-dynamic-shimmer-example prebuild:android
      - run: pnpm -F rn-dynamic-shimmer-example android:release
      - uses: mobile-dev-inc/action-maestro-cloud@v1
        with:
          api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
          app-file: apps/example/android/app/build/outputs/apk/release/app-release.apk
          workspace: apps/example/.maestro
          include-tags: e2e

  ios:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm -F react-native-dynamic-shimmer build
      - run: pnpm -F rn-dynamic-shimmer-example prebuild:ios
      - run: cd apps/example/ios && pod install
      - run: pnpm -F rn-dynamic-shimmer-example ios:release
      - uses: mobile-dev-inc/action-maestro-cloud@v1
        with:
          api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
          app-file: apps/example/ios/build/Build/Products/Release-iphonesimulator/rn-dynamic-shimmer-example.app
          workspace: apps/example/.maestro
          include-tags: e2e
```

- [ ] **Step 2: Obtain `MAESTRO_CLOUD_API_KEY`**

1. Sign up at `https://cloud.mobile.dev/`.
2. Create a project, copy the API key.
3. GitHub repo Secrets → add `MAESTRO_CLOUD_API_KEY`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/example.yml
git commit -m "$(cat <<'EOF'
ci: add example-app native builds + Maestro Cloud e2e workflow

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Release workflow (changesets + npm publish with provenance)

**Files:**

- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: Release
on:
  push:
    branches: [main]

concurrency:
  group: release
  cancel-in-progress: false

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: jdx/mise-action@v2
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter react-native-dynamic-shimmer build
      - uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm changeset version
          commit: "chore(release): version packages"
          title: "chore(release): version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: "true"
```

- [ ] **Step 2: Obtain `NPM_TOKEN`**

1. Log in to npm as `tychota`; create an **automation** token with publish permission.
2. GitHub repo Secrets → add `NPM_TOKEN`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "$(cat <<'EOF'
ci: add release workflow with changesets + npm provenance

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Dependabot, issue templates, CODEOWNERS, PR template

**Files:**

- Create: `.github/dependabot.yml`
- Create: `.github/CODEOWNERS`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`

- [ ] **Step 1: `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly" }
    open-pull-requests-limit: 5
    groups:
      testing: { patterns: ["vitest*", "@testing-library/*", "@callstack/reassure*"] }
      storybook: { patterns: ["storybook*", "@storybook/*", "chromatic"] }
      lint: { patterns: ["oxlint*", "oxfmt*", "eslint-plugin-*"] }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
```

- [ ] **Step 2: `.github/CODEOWNERS`**

```
* @tychota
```

- [ ] **Step 3: `.github/PULL_REQUEST_TEMPLATE.md`**

```md
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
```

- [ ] **Step 4: `.github/ISSUE_TEMPLATE/bug.yml`**

```yaml
name: Bug report
description: Something is broken
labels: ["bug"]
body:
  - type: input
    id: rn
    attributes: { label: "React Native version", placeholder: "0.76.0" }
    validations: { required: true }
  - type: input
    id: lib
    attributes: { label: "react-native-dynamic-shimmer version" }
    validations: { required: true }
  - type: textarea
    id: repro
    attributes: { label: "Reproduction", description: "Minimal code or Expo Snack URL" }
    validations: { required: true }
  - type: textarea
    id: expected
    attributes: { label: "Expected behavior" }
    validations: { required: true }
```

- [ ] **Step 5: `.github/ISSUE_TEMPLATE/feature.yml`**

```yaml
name: Feature request
description: Suggest a new capability
labels: ["enhancement"]
body:
  - type: textarea
    id: what
    attributes: { label: "What would you like?" }
    validations: { required: true }
  - type: textarea
    id: why
    attributes: { label: "Why do you need it?" }
    validations: { required: true }
  - type: textarea
    id: alternatives
    attributes: { label: "Alternatives you've considered" }
```

- [ ] **Step 6: Commit**

```bash
git add .github/dependabot.yml .github/CODEOWNERS .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE
git commit -m "$(cat <<'EOF'
chore: add dependabot, CODEOWNERS, PR + issue templates

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 5 — First release

## Task 12: Push to GitHub and set up branch protection

**Files:** None (GitHub settings only).

- [ ] **Step 1: Create the GitHub repo**

Run (from repo root): `gh repo create tychota/react-native-dynamic-shimmer --public --source=. --remote=origin --push`
Expected: repo exists at `https://github.com/tychota/react-native-dynamic-shimmer`; `main` branch pushed.

- [ ] **Step 2: Set branch protection on `main`**

Run:

```bash
gh api -X PUT repos/tychota/react-native-dynamic-shimmer/branches/main/protection \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f required_pull_request_reviews.dismiss_stale_reviews=true \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]="gate" \
  -f required_status_checks.contexts[]="perf" \
  -f required_status_checks.contexts[]="chromatic" \
  -f enforce_admins=false \
  -f restrictions=null \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -f required_linear_history=true
```

Expected: branch protection configured.

- [ ] **Step 3: Verify Chromatic and Maestro secrets are set**

Run: `gh secret list -R tychota/react-native-dynamic-shimmer`
Expected: `CHROMATIC_PROJECT_TOKEN`, `MAESTRO_CLOUD_API_KEY`, `NPM_TOKEN` all present.

- [ ] **Step 4: Enable GitHub Discussions**

Run: `gh api -X PATCH repos/tychota/react-native-dynamic-shimmer -f has_discussions=true`
Expected: discussions feature enabled.

- [ ] **Step 5: No commit (settings only).**

---

## Task 13: Cut v0.1.0 release

**Files:** None (release ritual).

- [ ] **Step 1: Verify a changeset exists**

Run: `ls .changeset/*.md | grep -v README.md`
Expected: at least one `.md` file from Plan 1 Task 33. If missing, create one:

Run: `pnpm changeset` and add a minor release note with the v0.1 summary.

- [ ] **Step 2: Open PR, wait for CI**

Run: `git checkout -b chore/cut-v0.1.0 && git push -u origin chore/cut-v0.1.0 && gh pr create --title "chore: ready v0.1.0" --body "Initial release — see changeset for details."`
Expected: PR opened; CI workflows trigger (gate, perf, chromatic, example).

- [ ] **Step 3: Merge and observe the release workflow**

Merge the PR to `main`. The release workflow opens a "Version packages" PR bumping `react-native-dynamic-shimmer` to `0.1.0`. Review and merge it.

- [ ] **Step 4: Verify npm publish**

Run: `npm view react-native-dynamic-shimmer`
Expected: package exists on npm with version `0.1.0`, homepage set, repo set, MIT license.

- [ ] **Step 5: Smoke-test in a fresh Expo app**

```bash
cd /tmp
npx create-expo-app@latest shimmer-smoke --template blank-typescript
cd shimmer-smoke
pnpm add react-native-dynamic-shimmer react-native-reanimated expo-linear-gradient
```

Edit `App.tsx` to render a trivial `<Skeleton>`; run on simulator; confirm the package resolves and runs. This step is manual and not automated; intent is to catch packaging bugs (exports map, peer deps) that CI won't.

- [ ] **Step 6: Tag the release in the repo history**

Run: `git tag v0.1.0 && git push origin v0.1.0`
Expected: tag appears; GitHub Releases page shows `v0.1.0` automatically (changesets/action creates the GitHub release).

---

# Self-review

**1. Spec coverage:** Storybook/Chromatic in §9.5. Maestro E2E + screenshots in §9.6 and §6 (covered by Task 4 and 5). Reassure baselines for 10- and 30-bone scenarios in §9.7 (covered by Task 6, partial — the 50-node fiber-walk and shimmer 5s baselines are not yet wired; they require direct invocation of internal helpers. Gap acknowledged — those specific baselines are deferred to post-v0.1 since the public-facing `measurePerformance` test is the primary signal). Size-limit in §9.7 (covered by Task 7). CI workflows per §10.7 in Tasks 8–10. Dependabot, CODEOWNERS, templates per §10.8 in Task 11. Release via changesets with npm provenance per §10.7 and §13 in Tasks 10 + 13.

**2. Placeholders:** None.

**3. Type consistency:** Storybook imports match the library's public surface (`Skeleton`, `Bone`, `find`, `findAll`, `hide`, `merge`, `RenderBoneFn`). Maestro YAML uses `id: "Loading"` matching `accessibilityLabel` default from Plan 1. Reassure test uses `measurePerformance` from the correct import.

**4. Gap filed for follow-up:** Spec §9.7 enumerates five baselines; this plan ships two (10- and 30-bone renders). The other three (loading-toggle re-render count, shimmer frame drops, fiber walk on 50-node tree) require additional harness code and are called out as follow-up work, not shipped in v0.1.

---

**Plan 3 complete.** 13 tasks. Produces: visual regression pipeline, E2E + native-visual Maestro flows, performance baselines, size budget, three CI workflows, issue/PR infrastructure, and a shipped v0.1.0 on npm.
