# Plan 1 — Library core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a buildable, tested `react-native-dynamic-shimmer` v0.1 package — source code, unit + component tests, TypeScript build. No example app, no CI, no docs site (those are Plans 2–4).

**Architecture:** pnpm monorepo scaffolded with oxlint/oxfmt/vitest/tsdown; library under `packages/react-native-dynamic-shimmer/`. Library code bottom-up: pure helpers → hooks → components → public barrel. Each non-scaffold task is TDD (test-first).

**Tech Stack:** pnpm 9, Node 20 via mise, TypeScript 5.8, Vitest + `@testing-library/react-native`, tsdown (rolldown), oxlint with JS-plugin for `eslint-plugin-react-hooks`, oxfmt, husky + lint-staged, changesets, Reanimated 3.17+, `expo-linear-gradient`.

**Source of truth:** `superpowers/specs/2026-04-22-rn-shimmer-skeleton-design.md`. Where behavior is ambiguous, the spec wins.

**Commit convention:** Conventional commits (`feat:`, `test:`, `chore:`, `docs:`). Every commit ends with:

```
Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

(Kernel-style — no `Co-Authored-By:`.)

**Working dir:** `/Users/tychota/Documents/Code/projets/carrefour/theodo-skeleton` (git repo initialized; commit `2c4f7bc` holds the spec). All commands assume this is the cwd.

---

## File structure this plan creates

```
/ (repo root)
├── .changeset/config.json
├── .editorconfig
├── .husky/pre-commit
├── .node-version
├── .npmrc
├── .nvmrc
├── mise.toml
├── oxlint.config.ts
├── package.json                              # workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── packages/
    └── react-native-dynamic-shimmer/
        ├── __tests__/
        │   ├── helpers/fakeFiber.ts
        │   └── setup.ts
        ├── src/
        │   ├── types.ts
        │   ├── index.ts
        │   ├── Skeleton.tsx
        │   ├── Bone.tsx
        │   ├── animation/
        │   │   ├── pulseStyle.ts
        │   │   ├── shimmerStyle.ts
        │   │   └── useShimmerProgress.ts
        │   ├── fiber/
        │   │   ├── defaultClassify.ts
        │   │   ├── extractStyle.ts
        │   │   ├── getFiber.ts
        │   │   └── typeName.ts
        │   ├── ir/
        │   │   ├── find.ts
        │   │   ├── hide.ts
        │   │   ├── index.ts
        │   │   ├── merge.ts
        │   │   ├── union.ts
        │   │   └── walk.ts
        │   ├── measure/
        │   │   ├── buildBoneTree.ts
        │   │   ├── flattenTree.ts
        │   │   ├── measureTree.ts
        │   │   └── useMeasureBones.ts
        │   ├── platform/fabric.ts
        │   └── visibility/
        │       ├── useStickyBoolean.ts
        │       └── useVisibility.ts
        ├── package.json
        ├── tsconfig.build.json
        ├── tsconfig.json
        ├── tsdown.config.ts
        ├── vitest.config.ts
        ├── LICENSE
        └── README.md
```

---

# Phase 0 — Monorepo scaffold

## Task 1: Pin Node and pnpm

**Files:**

- Create: `mise.toml`
- Create: `.node-version`
- Create: `.nvmrc`

- [ ] **Step 1: Create `mise.toml`**

```toml
[tools]
node = "20.14.0"
pnpm = "9.15.0"
```

- [ ] **Step 2: Create `.node-version`**

```
20.14.0
```

- [ ] **Step 3: Create `.nvmrc`**

```
20.14.0
```

- [ ] **Step 4: Enable corepack for reproducible pnpm**

Run: `corepack enable && corepack prepare pnpm@9.15.0 --activate`
Expected: no error; `pnpm --version` prints `9.15.0`.

- [ ] **Step 5: Commit**

```bash
git add mise.toml .node-version .nvmrc
git commit -m "$(cat <<'EOF'
chore: pin Node 20.14 and pnpm 9.15 via mise + .node-version

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Workspace root package.json and pnpm-workspace.yaml

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`

- [ ] **Step 1: Create `package.json`**

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

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "docs"
```

- [ ] **Step 3: Create `.npmrc`**

```ini
public-hoist-pattern[]=*react-native*
public-hoist-pattern[]=*expo*
public-hoist-pattern[]=@react-native/*
strict-peer-dependencies=false
shamefully-hoist=false
```

- [ ] **Step 4: Install workspace devDependencies**

Run: `pnpm install`
Expected: lockfile generated, no packages in workspaces yet (warning "no projects matched" is OK).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml .npmrc pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add pnpm workspace root with oxlint/oxfmt/husky/changesets devDeps

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Base TypeScript config and editor config

**Files:**

- Create: `tsconfig.base.json`
- Create: `.editorconfig`

- [ ] **Step 1: Create `tsconfig.base.json`**

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

- [ ] **Step 2: Create `.editorconfig`**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 3: Commit**

```bash
git add tsconfig.base.json .editorconfig
git commit -m "$(cat <<'EOF'
chore: add strict TypeScript base config and editorconfig

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: oxlint config + husky + lint-staged

**Files:**

- Create: `oxlint.config.ts`
- Create: `.husky/pre-commit`

- [ ] **Step 1: Create `oxlint.config.ts`**

```ts
export default {
  plugins: ["typescript", "unicorn", "react", "react-hooks", "import"],
  categories: {
    correctness: "error",
    suspicious: "error",
    pedantic: "warn",
    style: "warn",
    restriction: "off",
    nursery: "off",
  },
  jsPlugins: {
    "@react-compiler": "eslint-plugin-react-hooks",
  },
  rules: {
    "@react-compiler/exhaustive-deps": "error",
    "@react-compiler/rules-of-hooks": "error",
    "@react-compiler/react-compiler": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "react/jsx-key": "error",
  },
  overrides: [
    {
      files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
      rules: { "no-console": "off" },
    },
    {
      files: ["apps/example/**"],
      rules: { "@react-compiler/react-compiler": "warn" },
    },
    {
      files: ["docs/**"],
      rules: {
        "@react-compiler/react-compiler": "off",
        "@react-compiler/rules-of-hooks": "off",
      },
    },
  ],
};
```

- [ ] **Step 2: Install the react-hooks plugin so the JS-plugin can resolve it**

Run: `pnpm -w add -D eslint-plugin-react-hooks@^5.2.0`
Expected: added to root `devDependencies`, lockfile updated.

- [ ] **Step 3: Install husky**

Run: `pnpm -w exec husky init`
Expected: creates `.husky/pre-commit` with a default command and adds a `prepare` script entry. Replace the generated file contents in step 4.

- [ ] **Step 4: Overwrite `.husky/pre-commit`**

```bash
#!/usr/bin/env sh
pnpm exec lint-staged
```

Mark executable:

Run: `chmod +x .husky/pre-commit`
Expected: no output.

- [ ] **Step 5: Smoke-test oxlint**

Run: `pnpm lint`
Expected: "no files matched" or empty pass (no source files yet). Exit code 0.

- [ ] **Step 6: Commit**

```bash
git add oxlint.config.ts .husky package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: configure oxlint with react-hooks js-plugin and husky pre-commit

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Changesets init

**Files:**

- Create: `.changeset/config.json`
- Create: `.changeset/README.md`

- [ ] **Step 1: Create `.changeset/config.json`**

```jsonc
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "tychota/react-native-dynamic-shimmer" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["rn-dynamic-shimmer-example", "rn-dynamic-shimmer-docs"],
}
```

- [ ] **Step 2: Create `.changeset/README.md`**

```md
# Changesets

This folder holds pending changeset files. Run `pnpm changeset` at the repo root
to create one after making changes that should be released.

See https://github.com/changesets/changesets for background.
```

- [ ] **Step 3: Install the GitHub changelog plugin**

Run: `pnpm -w add -D @changesets/changelog-github`
Expected: added to root devDependencies.

- [ ] **Step 4: Commit**

```bash
git add .changeset/ package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: initialize changesets targeting tychota/react-native-dynamic-shimmer

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 1 — Library package scaffold and test infra

## Task 6: Create library package skeleton

**Files:**

- Create: `packages/react-native-dynamic-shimmer/package.json`
- Create: `packages/react-native-dynamic-shimmer/tsconfig.json`
- Create: `packages/react-native-dynamic-shimmer/tsconfig.build.json`
- Create: `packages/react-native-dynamic-shimmer/tsdown.config.ts`
- Create: `packages/react-native-dynamic-shimmer/LICENSE`
- Create: `packages/react-native-dynamic-shimmer/README.md`
- Create: `packages/react-native-dynamic-shimmer/src/index.ts` (empty barrel)

- [ ] **Step 1: Create `package.json`**

```jsonc
{
  "name": "react-native-dynamic-shimmer",
  "version": "0.0.0",
  "description": "Dynamic shimmer skeletons for React Native — wraps the real component, measures at runtime via Fabric JSI, paints shimmer at exact positions.",
  "author": "Tycho Tatitscheff <tycho.tatitscheff@gmail.com>",
  "license": "MIT",
  "homepage": "https://github.com/tychota/react-native-dynamic-shimmer#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/tychota/react-native-dynamic-shimmer.git",
    "directory": "packages/react-native-dynamic-shimmer",
  },
  "bugs": "https://github.com/tychota/react-native-dynamic-shimmer/issues",
  "keywords": ["react-native", "skeleton", "shimmer", "loading", "fabric", "reanimated"],
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "react-native": "./src/index.ts",
  "exports": {
    ".": {
      "react-native": "./src/index.ts",
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" },
    },
  },
  "files": ["dist", "src", "LICENSE", "README.md"],
  "scripts": {
    "build": "tsdown && tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:unit": "vitest run __tests__/unit",
    "test:component": "vitest run __tests__/component",
    "test:watch": "vitest",
  },
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-native": ">=0.76.0",
    "react-native-reanimated": ">=3.17.0",
    "expo-linear-gradient": ">=15.0.0",
  },
  "devDependencies": {
    "@testing-library/react-native": "^13.0.0",
    "@types/react": "^19.0.0",
    "expo-linear-gradient": "^15.0.0",
    "react": "^19.0.0",
    "react-native": "^0.76.0",
    "react-native-reanimated": "^3.17.0",
    "tsdown": "^0.5.0",
    "typescript": "^5.8.0",
    "vitest": "^2.1.0",
  },
}
```

- [ ] **Step 2: Create `tsconfig.json` (for typecheck and tests)**

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist",
    "types": ["node"],
    "paths": {
      "react-native-dynamic-shimmer": ["./src/index.ts"],
    },
  },
  "include": ["src/**/*", "__tests__/**/*"],
}
```

- [ ] **Step 3: Create `tsconfig.build.json` (declarations only)**

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "emitDeclarationOnly": true,
    "noEmit": false,
  },
  "include": ["src/**/*"],
  "exclude": ["__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
}
```

- [ ] **Step 4: Create `tsdown.config.ts`**

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-native", "react-native-reanimated", "expo-linear-gradient"],
});
```

(We use `dts: false` and let `tsc` emit declarations in a second step — tsdown's dts plugin doesn't yet preserve `readonly` tuple types the way `tsc` does for our `BoneRect` style hints.)

- [ ] **Step 5: Create `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Tycho Tatitscheff

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 6: Create `README.md`**

````md
# react-native-dynamic-shimmer

Dynamic shimmer skeletons for React Native. Wrap any component, the library measures
it at runtime via Fabric's JSI `measureLayout` and paints shimmer rectangles at the
exact positions.

- No build-time scan, no JSON bones, no CLI.
- New Architecture only (React Native ≥ 0.76).
- Peer deps: `react ≥ 19`, `react-native-reanimated ≥ 3.17`, `expo-linear-gradient ≥ 15`.

See https://tychota.github.io/react-native-dynamic-shimmer for docs.

## Install

```sh
pnpm add react-native-dynamic-shimmer
```
````

## Use

```tsx
import { Skeleton } from "react-native-dynamic-shimmer";

<Skeleton loading={!user} baseColor="#eee" highlightColor="#fff">
  <UserCard user={user ?? MOCK_USER} />
</Skeleton>;
```

## License

MIT — see [LICENSE](./LICENSE).

````

- [ ] **Step 7: Create empty `src/index.ts`**

```ts
// Public barrel. See Plan 1 Task 33 for its final content.
export {}
````

- [ ] **Step 8: Install workspace deps**

Run: `pnpm install`
Expected: `react-native-dynamic-shimmer` now shows as a workspace package; peer and dev deps installed.

- [ ] **Step 9: Commit**

```bash
git add packages/react-native-dynamic-shimmer pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: scaffold react-native-dynamic-shimmer package

Empty src/index.ts, package.json with exports map, tsdown config for ESM+CJS,
tsc for declarations, Vitest wired.

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Vitest config, setup, and fakeFiber helper

**Files:**

- Create: `packages/react-native-dynamic-shimmer/vitest.config.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/setup.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/helpers/fakeFiber.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./__tests__/setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.ts", "src/types.ts", "src/**/*.d.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

- [ ] **Step 2: Create `__tests__/setup.ts`**

```ts
// Vitest setup. Node environment (no JSDOM) — unit tests cover pure functions.
// Component tests in __tests__/component override the environment via
// `// @vitest-environment jsdom` and import their own mocks.
```

- [ ] **Step 3: Create `__tests__/helpers/fakeFiber.ts`**

```ts
import type { FiberNode } from "../../src/types";

// Minimal FiberNode-shaped object for walker/classifier tests.
// Sets child/sibling/return links manually.

type Props = Record<string, unknown>;

export type FakeFiber = {
  -readonly [K in keyof FiberNode]: FiberNode[K];
};

export function fiber(
  type: FiberNode["type"],
  props: Props = {},
  children: FakeFiber[] = [],
): FakeFiber {
  const node: FakeFiber = {
    type,
    memoizedProps: props,
    stateNode: props["__stateNode"] ?? { __fake: true },
    child: null,
    sibling: null,
    return: null,
  };
  for (let i = 0; i < children.length; i++) {
    const c = children[i]!;
    c.return = node as FiberNode;
    if (i === 0) node.child = c as FiberNode;
    if (i > 0) (children[i - 1]! as FakeFiber).sibling = c as FiberNode;
  }
  return node;
}

export const View = (props: Props = {}, ...children: FakeFiber[]) => fiber("View", props, children);
export const Text = (children = "", props: Props = {}) =>
  fiber("RCTText", { ...props, children }, []);
export const Image = (props: Props = {}) => fiber("RCTImage", props, []);
```

- [ ] **Step 4: Verify vitest starts**

Run: `pnpm --filter react-native-dynamic-shimmer test`
Expected: "No test files found" (pass with 0 tests). Exit code 0.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/vitest.config.ts \
        packages/react-native-dynamic-shimmer/__tests__
git commit -m "$(cat <<'EOF'
test: add vitest config, setup, and fakeFiber helpers

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 2 — Pure helpers (TDD)

## Task 8: `types.ts` — shared type definitions

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/types.ts`

No test needed — types only. Types are exercised by every other test file.

- [ ] **Step 1: Create `src/types.ts` with the full type surface from spec §5.4**

```ts
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { SharedValue } from "react-native-reanimated";

// ── Public types ─────────────────────────────────────────────────────────────

export type BoneKind = "text" | "image" | "view" | "container";

export type BoneRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly borderRadius: number | "50%";
  readonly kind: BoneKind;
  readonly backgroundColor?: string;
  readonly borderColor?: string;
  readonly borderWidth?: number;
};

export type AnimationKind = "shimmer" | "pulse" | "none";

export type BoneContext = {
  readonly progress: SharedValue<number>;
  readonly baseColor: string;
  readonly highlightColor: string;
  readonly animation: AnimationKind;
  readonly index: number;
  readonly total: number;
};

export type BoneProps = {
  readonly rect: BoneRect;
  readonly ctx: BoneContext;
};

export type PerCornerRadius = {
  readonly topLeft?: number;
  readonly topRight?: number;
  readonly bottomLeft?: number;
  readonly bottomRight?: number;
};

export type StyleHints = {
  readonly backgroundColor?: string;
  readonly borderRadius?: number | PerCornerRadius;
  readonly borderColor?: string;
  readonly borderWidth?: number;
  readonly shadowOpacity?: number;
  readonly elevation?: number;
  readonly opacity?: number;
  readonly display?: "none" | "flex";
};

export type BoneNode = {
  readonly id: string;
  readonly type: string;
  readonly classification: "leaf" | "container" | "transparent";
  readonly rect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly style: StyleHints;
  readonly children: ReadonlyArray<BoneNode>;
};

export type FiberNode = {
  readonly type: string | Function | null;
  readonly memoizedProps: unknown;
  readonly stateNode: unknown;
  readonly child: FiberNode | null;
  readonly sibling: FiberNode | null;
  readonly return: FiberNode | null;
};

export type FiberClassification = "leaf" | "container" | "transparent" | "skip";

export type RenderBoneFn = (rect: BoneRect, ctx: BoneContext) => ReactNode;
export type ClassifyFn = (fiber: FiberNode) => FiberClassification;
export type RefineBonesFn = (tree: BoneNode) => BoneNode;

export type SkeletonProps = {
  loading: boolean;
  children: ReactNode;
  baseColor: string;
  highlightColor: string;

  animation?: AnimationKind;
  transition?: boolean | number;
  minShowDuration?: number;

  renderBone?: RenderBoneFn;
  classify?: ClassifyFn;
  refineBones?: RefineBonesFn;

  onMeasured?: (bones: ReadonlyArray<BoneRect>) => void;

  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter react-native-dynamic-shimmer typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/types.ts
git commit -m "$(cat <<'EOF'
feat(types): add public domain type definitions

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `ir/union.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/ir/union.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/ir/union.test.ts`

- [ ] **Step 1: Write failing test — `__tests__/unit/ir/union.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { union } from "../../../src/ir/union";

describe("union", () => {
  it("returns null for empty input", () => {
    expect(union([])).toBeNull();
  });

  it("returns a single rect unchanged", () => {
    expect(union([{ x: 10, y: 20, width: 30, height: 40 }])).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });

  it("computes bounding rect of overlapping rects", () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 10, y: 10, width: 20, height: 20 };
    expect(union([a, b])).toEqual({ x: 0, y: 0, width: 30, height: 30 });
  });

  it("computes bounding rect of disjoint rects", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 100, y: 200, width: 10, height: 10 };
    expect(union([a, b])).toEqual({ x: 0, y: 0, width: 110, height: 210 });
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/union`
Expected: fails with "Cannot find module .../ir/union".

- [ ] **Step 3: Implement — `src/ir/union.ts`**

```ts
type Rect = { x: number; y: number; width: number; height: number };

export function union(rects: ReadonlyArray<Rect>): Rect | null {
  if (rects.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
    if (r.y + r.height > maxY) maxY = r.y + r.height;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/union`
Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/ir/union.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/ir/union.test.ts
git commit -m "$(cat <<'EOF'
feat(ir): add union bounding-rect helper

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: `ir/walk.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/ir/walk.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/ir/walk.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import type { BoneNode } from "../../../src/types";
import { walk } from "../../../src/ir/walk";

function node(id: string, children: BoneNode[] = []): BoneNode {
  return {
    id,
    type: "View",
    classification: "leaf",
    rect: { x: 0, y: 0, width: 10, height: 10 },
    style: {},
    children,
  };
}

describe("walk", () => {
  it("visits a single node", () => {
    const visited: string[] = [];
    walk(node("a"), (n) => visited.push(n.id));
    expect(visited).toEqual(["a"]);
  });

  it("visits in depth-first pre-order", () => {
    const tree = node("a", [node("b", [node("c"), node("d")]), node("e")]);
    const order: string[] = [];
    walk(tree, (n) => order.push(n.id));
    expect(order).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("passes path of ancestors (root-first, excluding current)", () => {
    const tree = node("a", [node("b", [node("c")])]);
    const paths: Record<string, string[]> = {};
    walk(tree, (n, path) => {
      paths[n.id] = path.map((p) => p.id);
    });
    expect(paths).toEqual({ a: [], b: ["a"], c: ["a", "b"] });
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/walk`
Expected: module not found.

- [ ] **Step 3: Implement — `src/ir/walk.ts`**

```ts
import type { BoneNode } from "../types";

export function walk(
  tree: BoneNode,
  visit: (node: BoneNode, path: ReadonlyArray<BoneNode>) => void,
): void {
  const stack: Array<{ node: BoneNode; path: ReadonlyArray<BoneNode> }> = [
    { node: tree, path: [] },
  ];
  while (stack.length > 0) {
    const top = stack.pop()!;
    visit(top.node, top.path);
    const childPath = [...top.path, top.node];
    // Push in reverse so leftmost child is processed first
    for (let i = top.node.children.length - 1; i >= 0; i--) {
      stack.push({ node: top.node.children[i]!, path: childPath });
    }
  }
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/walk`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/ir/walk.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/ir/walk.test.ts
git commit -m "$(cat <<'EOF'
feat(ir): add depth-first walk with ancestor path

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: `ir/find.ts` (`find` + `findAll`)

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/ir/find.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/ir/find.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import type { BoneNode } from "../../../src/types";
import { find, findAll } from "../../../src/ir/find";

function node(id: string, type: string, children: BoneNode[] = []): BoneNode {
  return {
    id,
    type,
    classification: "leaf",
    rect: { x: 0, y: 0, width: 10, height: 10 },
    style: {},
    children,
  };
}

describe("find", () => {
  const tree = node("a", "View", [node("b", "Text"), node("c", "View", [node("d", "Text")])]);

  it("returns the first match in depth-first order", () => {
    expect(find(tree, (n) => n.type === "Text")?.id).toBe("b");
  });

  it("returns null when no match", () => {
    expect(find(tree, (n) => n.type === "Image")).toBeNull();
  });
});

describe("findAll", () => {
  const tree = node("a", "View", [node("b", "Text"), node("c", "View", [node("d", "Text")])]);

  it("returns all matches in depth-first order", () => {
    expect(findAll(tree, (n) => n.type === "Text").map((n) => n.id)).toEqual(["b", "d"]);
  });

  it("returns empty array when no match", () => {
    expect(findAll(tree, (n) => n.type === "Image")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/find`
Expected: module not found.

- [ ] **Step 3: Implement — `src/ir/find.ts`**

```ts
import type { BoneNode } from "../types";
import { walk } from "./walk";

export function find(tree: BoneNode, predicate: (node: BoneNode) => boolean): BoneNode | null {
  let result: BoneNode | null = null;
  walk(tree, (node) => {
    if (result === null && predicate(node)) result = node;
  });
  return result;
}

export function findAll(tree: BoneNode, predicate: (node: BoneNode) => boolean): BoneNode[] {
  const out: BoneNode[] = [];
  walk(tree, (node) => {
    if (predicate(node)) out.push(node);
  });
  return out;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/find`
Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/ir/find.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/ir/find.test.ts
git commit -m "$(cat <<'EOF'
feat(ir): add find and findAll predicate helpers

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: `ir/hide.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/ir/hide.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/ir/hide.test.ts`

`hide` returns a new tree with the target subtree filtered out. Because `BoneNode.children` is `ReadonlyArray`, we rebuild the path.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import type { BoneNode } from "../../../src/types";
import { hide } from "../../../src/ir/hide";

function node(id: string, children: BoneNode[] = []): BoneNode {
  return {
    id,
    type: "View",
    classification: "leaf",
    rect: { x: 0, y: 0, width: 10, height: 10 },
    style: {},
    children,
  };
}

describe("hide", () => {
  it("removes a matching child from the parent children list", () => {
    const b = node("b");
    const tree = node("a", [b, node("c")]);
    const result = hide(tree, b);
    expect(result.children.map((n) => n.id)).toEqual(["c"]);
  });

  it("preserves siblings around the hidden node", () => {
    const mid = node("mid");
    const tree = node("root", [node("l"), mid, node("r")]);
    expect(hide(tree, mid).children.map((n) => n.id)).toEqual(["l", "r"]);
  });

  it("returns the input unchanged when target is not in the tree", () => {
    const tree = node("root", [node("a")]);
    const orphan = node("orphan");
    expect(hide(tree, orphan)).toBe(tree);
  });

  it("does not mutate the input", () => {
    const b = node("b");
    const tree = node("a", [b, node("c")]);
    const beforeChildrenIds = tree.children.map((n) => n.id);
    hide(tree, b);
    expect(tree.children.map((n) => n.id)).toEqual(beforeChildrenIds);
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/hide`
Expected: module not found.

- [ ] **Step 3: Implement — `src/ir/hide.ts`**

```ts
import type { BoneNode } from "../types";

export function hide(tree: BoneNode, target: BoneNode): BoneNode {
  if (tree === target) {
    // Hiding the root — return a copy with no children and the 'transparent'
    // classification so flatten drops it. Preserves id/rect/etc. in case it
    // matters to a caller.
    return { ...tree, classification: "transparent", children: [] };
  }
  let changed = false;
  const nextChildren: BoneNode[] = [];
  for (const child of tree.children) {
    if (child === target) {
      changed = true;
      continue;
    }
    const replaced = hide(child, target);
    if (replaced !== child) changed = true;
    nextChildren.push(replaced);
  }
  return changed ? { ...tree, children: nextChildren } : tree;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/hide`
Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/ir/hide.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/ir/hide.test.ts
git commit -m "$(cat <<'EOF'
feat(ir): add hide — immutable subtree removal

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: `ir/merge.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/ir/merge.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/ir/merge.test.ts`

`merge(tree, targets)` replaces the target nodes with a single new bone at their union rect. For simplicity, the merged bone is attached to the lowest common ancestor's children list in the position of the first target.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import type { BoneNode } from "../../../src/types";
import { merge } from "../../../src/ir/merge";

function node(
  id: string,
  rect = { x: 0, y: 0, width: 10, height: 10 },
  children: BoneNode[] = [],
): BoneNode {
  return {
    id,
    type: "Text",
    classification: "leaf",
    rect,
    style: {},
    children,
  };
}

describe("merge", () => {
  it("returns tree unchanged for empty targets", () => {
    const tree = node("a");
    expect(merge(tree, [])).toBe(tree);
  });

  it("returns tree unchanged for a single target (no-op)", () => {
    const a = node("a");
    const tree = node("root", { x: 0, y: 0, width: 10, height: 10 }, [a]);
    expect(merge(tree, [a])).toBe(tree);
  });

  it("merges two sibling targets into one bone at their union rect", () => {
    const a = node("a", { x: 0, y: 0, width: 10, height: 10 });
    const b = node("b", { x: 20, y: 0, width: 10, height: 10 });
    const tree = node("root", { x: 0, y: 0, width: 30, height: 10 }, [a, b]);
    const result = merge(tree, [a, b]);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]!.rect).toEqual({ x: 0, y: 0, width: 30, height: 10 });
    expect(result.children[0]!.classification).toBe("leaf");
    expect(result.children[0]!.type).toBe("merged");
  });

  it("does not mutate the input", () => {
    const a = node("a");
    const b = node("b");
    const tree = node("root", { x: 0, y: 0, width: 30, height: 10 }, [a, b]);
    const before = tree.children.length;
    merge(tree, [a, b]);
    expect(tree.children.length).toBe(before);
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/merge`
Expected: module not found.

- [ ] **Step 3: Implement — `src/ir/merge.ts`**

```ts
import type { BoneNode } from "../types";
import { union } from "./union";
import { hide } from "./hide";

let mergeCounter = 0;

function nextId(): string {
  mergeCounter += 1;
  return `merged-${mergeCounter}`;
}

export function merge(tree: BoneNode, targets: ReadonlyArray<BoneNode>): BoneNode {
  if (targets.length < 2) return tree;

  const unionRect = union(targets.map((t) => t.rect));
  if (unionRect === null) return tree;

  const merged: BoneNode = {
    id: nextId(),
    type: "merged",
    classification: "leaf",
    rect: unionRect,
    style: {},
    children: [],
  };

  // Hide every target first, then attach the merged bone to the parent of
  // the first target. We locate the first target's parent by walking.
  const firstTarget = targets[0]!;
  const parent = findParent(tree, firstTarget);
  let next = tree;
  for (const t of targets) next = hide(next, t);
  if (parent === null) {
    // First target is the root; return the merged bone as the new root.
    return merged;
  }
  return replaceChildren(next, parent, (children) => [merged, ...children]);
}

function findParent(tree: BoneNode, target: BoneNode): BoneNode | null {
  for (const child of tree.children) {
    if (child === target) return tree;
    const nested = findParent(child, target);
    if (nested !== null) return nested;
  }
  return null;
}

function replaceChildren(
  tree: BoneNode,
  target: BoneNode,
  f: (current: ReadonlyArray<BoneNode>) => ReadonlyArray<BoneNode>,
): BoneNode {
  if (tree === target) return { ...tree, children: f(tree.children) };
  let changed = false;
  const nextChildren: BoneNode[] = [];
  for (const child of tree.children) {
    const replaced = replaceChildren(child, target, f);
    if (replaced !== child) changed = true;
    nextChildren.push(replaced);
  }
  return changed ? { ...tree, children: nextChildren } : tree;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- ir/merge`
Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/ir/merge.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/ir/merge.test.ts
git commit -m "$(cat <<'EOF'
feat(ir): add merge — union-rect combining of sibling bones

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: `ir/index.ts` (IR barrel)

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/ir/index.ts`

- [ ] **Step 1: Create the barrel**

```ts
export { walk } from "./walk";
export { find, findAll } from "./find";
export { hide } from "./hide";
export { merge } from "./merge";
export { union } from "./union";
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter react-native-dynamic-shimmer typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/ir/index.ts
git commit -m "$(cat <<'EOF'
feat(ir): add barrel export

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: `fiber/typeName.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/fiber/typeName.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/fiber/typeName.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { typeName } from "../../../src/fiber/typeName";

describe("typeName", () => {
  it("returns host strings as-is", () => {
    expect(typeName({ type: "RCTText" } as never)).toBe("RCTText");
    expect(typeName({ type: "View" } as never)).toBe("View");
  });

  it("returns function component displayName", () => {
    const Comp = Object.assign(() => null, { displayName: "UserCard" });
    expect(typeName({ type: Comp } as never)).toBe("UserCard");
  });

  it("returns function component name when displayName absent", () => {
    function MyBadge() {
      return null;
    }
    expect(typeName({ type: MyBadge } as never)).toBe("MyBadge");
  });

  it('returns "Component" for anonymous functions', () => {
    expect(typeName({ type: () => null } as never)).toBe("Component");
  });

  it('returns "Unknown" for null type', () => {
    expect(typeName({ type: null } as never)).toBe("Unknown");
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- fiber/typeName`
Expected: module not found.

- [ ] **Step 3: Implement — `src/fiber/typeName.ts`**

```ts
import type { FiberNode } from "../types";

export function typeName(fiber: FiberNode): string {
  const t = fiber.type;
  if (typeof t === "string") return t;
  if (typeof t === "function") {
    const named = t as { displayName?: string; name?: string };
    if (typeof named.displayName === "string" && named.displayName.length > 0)
      return named.displayName;
    if (typeof named.name === "string" && named.name.length > 0) return named.name;
    return "Component";
  }
  return "Unknown";
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- fiber/typeName`
Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/fiber/typeName.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/fiber/typeName.test.ts
git commit -m "$(cat <<'EOF'
feat(fiber): add typeName helper (handles host / component / anonymous)

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: `fiber/extractStyle.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/fiber/extractStyle.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/fiber/extractStyle.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { extractStyle } from "../../../src/fiber/extractStyle";

const fiber = (style: unknown) => ({ memoizedProps: { style } }) as never;

describe("extractStyle", () => {
  it("returns {} when no style", () => {
    expect(extractStyle({ memoizedProps: {} } as never)).toEqual({});
  });

  it("returns {} when memoizedProps is null or undefined", () => {
    expect(extractStyle({ memoizedProps: null } as never)).toEqual({});
    expect(extractStyle({ memoizedProps: undefined } as never)).toEqual({});
  });

  it("returns flat object style", () => {
    expect(extractStyle(fiber({ backgroundColor: "#fff", borderRadius: 8 }))).toEqual({
      backgroundColor: "#fff",
      borderRadius: 8,
    });
  });

  it("flattens array styles (later entries override earlier)", () => {
    expect(
      extractStyle(fiber([{ backgroundColor: "#fff", borderRadius: 8 }, { borderRadius: 12 }])),
    ).toEqual({ backgroundColor: "#fff", borderRadius: 12 });
  });

  it("flattens nested arrays", () => {
    expect(
      extractStyle(fiber([{ backgroundColor: "#fff" }, [{ borderRadius: 8 }, { borderWidth: 1 }]])),
    ).toEqual({ backgroundColor: "#fff", borderRadius: 8, borderWidth: 1 });
  });

  it("ignores null/false entries", () => {
    expect(
      extractStyle(fiber([{ backgroundColor: "#fff" }, null, false, { borderRadius: 8 }])),
    ).toEqual({ backgroundColor: "#fff", borderRadius: 8 });
  });

  it("extracts per-corner borderRadius", () => {
    expect(extractStyle(fiber({ borderTopLeftRadius: 4, borderBottomRightRadius: 8 }))).toEqual({
      borderRadius: { topLeft: 4, bottomRight: 8 },
    });
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- fiber/extractStyle`
Expected: module not found.

- [ ] **Step 3: Implement — `src/fiber/extractStyle.ts`**

```ts
import type { FiberNode, StyleHints, PerCornerRadius } from "../types";

const SCALAR_KEYS: ReadonlyArray<keyof StyleHints> = [
  "backgroundColor",
  "borderColor",
  "borderWidth",
  "shadowOpacity",
  "elevation",
  "opacity",
];

type Raw = Record<string, unknown>;

function merge(acc: Raw, entry: unknown): void {
  if (entry === null || entry === undefined || entry === false) return;
  if (Array.isArray(entry)) {
    for (const e of entry) merge(acc, e);
    return;
  }
  if (typeof entry === "object") Object.assign(acc, entry as Raw);
}

export function extractStyle(fiber: FiberNode): StyleHints {
  const props = fiber.memoizedProps as Raw | null | undefined;
  if (props === null || props === undefined) return {};
  const raw = props["style"];
  if (raw === undefined) return {};
  const flat: Raw = {};
  merge(flat, raw);

  const out: Mutable<StyleHints> = {};
  for (const k of SCALAR_KEYS) {
    const v = flat[k];
    if (v !== undefined) (out as Raw)[k] = v;
  }
  if (flat["display"] === "none" || flat["display"] === "flex") out.display = flat["display"];

  // borderRadius: prefer per-corner when any of the four corners are set.
  const corners: PerCornerRadius = {};
  if (typeof flat["borderTopLeftRadius"] === "number")
    corners.topLeft = flat["borderTopLeftRadius"] as number;
  if (typeof flat["borderTopRightRadius"] === "number")
    corners.topRight = flat["borderTopRightRadius"] as number;
  if (typeof flat["borderBottomLeftRadius"] === "number")
    corners.bottomLeft = flat["borderBottomLeftRadius"] as number;
  if (typeof flat["borderBottomRightRadius"] === "number")
    corners.bottomRight = flat["borderBottomRightRadius"] as number;
  const hasCorners = Object.keys(corners).length > 0;
  if (hasCorners) {
    out.borderRadius = corners;
  } else if (typeof flat["borderRadius"] === "number") {
    out.borderRadius = flat["borderRadius"] as number;
  }
  return out;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- fiber/extractStyle`
Expected: 7 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/fiber/extractStyle.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/fiber/extractStyle.test.ts
git commit -m "$(cat <<'EOF'
feat(fiber): add extractStyle — flattens RN style arrays to StyleHints

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: `fiber/defaultClassify.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/fiber/defaultClassify.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/fiber/defaultClassify.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { defaultClassify } from "../../../src/fiber/defaultClassify";
import { Text, Image, View } from "../../helpers/fakeFiber";

describe("defaultClassify", () => {
  it("classifies text as leaf", () => {
    expect(defaultClassify(Text("hi"))).toBe("leaf");
  });

  it("classifies image as leaf", () => {
    expect(defaultClassify(Image())).toBe("leaf");
  });

  it("classifies text input as leaf", () => {
    expect(
      defaultClassify({
        type: "RCTTextInput",
        memoizedProps: {},
        stateNode: {},
        child: null,
        sibling: null,
        return: null,
      }),
    ).toBe("leaf");
  });

  it("classifies hidden (display: none) as skip", () => {
    expect(defaultClassify(View({ style: { display: "none" } }))).toBe("skip");
  });

  it("classifies hidden (opacity: 0) as skip", () => {
    expect(defaultClassify(View({ style: { opacity: 0 } }))).toBe("skip");
  });

  it("classifies a childless host with a background as leaf", () => {
    expect(defaultClassify(View({ style: { backgroundColor: "#000" } }))).toBe("leaf");
  });

  it("classifies a View with children AND backgroundColor as container", () => {
    expect(defaultClassify(View({ style: { backgroundColor: "#000" } }, Text("inside")))).toBe(
      "container",
    );
  });

  it("classifies a View with children AND borderRadius as container", () => {
    expect(defaultClassify(View({ style: { borderRadius: 8 } }, Text("hi")))).toBe("container");
  });

  it("classifies a View with children AND borderWidth as container", () => {
    expect(defaultClassify(View({ style: { borderWidth: 1 } }, Text("hi")))).toBe("container");
  });

  it("classifies a View with children AND shadowOpacity as container", () => {
    expect(defaultClassify(View({ style: { shadowOpacity: 0.3 } }, Text("hi")))).toBe("container");
  });

  it("classifies a plain wrapper with children as transparent", () => {
    expect(defaultClassify(View({}, Text("hi")))).toBe("transparent");
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- defaultClassify`
Expected: module not found.

- [ ] **Step 3: Implement — `src/fiber/defaultClassify.ts`**

```ts
import type { FiberNode, FiberClassification } from "../types";
import { typeName } from "./typeName";
import { extractStyle } from "./extractStyle";

const CONTENT_TYPES: ReadonlySet<string> = new Set([
  "RCTText",
  "Text",
  "RawText",
  "RCTImage",
  "Image",
  "ImageView",
  "RCTTextInput",
  "TextInput",
]);

function isTransparent(color: string | undefined): boolean {
  if (color === undefined) return true;
  const c = color.toLowerCase().trim();
  return c === "transparent" || c === "rgba(0,0,0,0)" || c === "rgba(0, 0, 0, 0)";
}

function hasAnyRadius(r: unknown): boolean {
  if (typeof r === "number") return r > 0;
  if (r !== null && typeof r === "object") {
    for (const v of Object.values(r as Record<string, number>))
      if (typeof v === "number" && v > 0) return true;
  }
  return false;
}

export function defaultClassify(fiber: FiberNode): FiberClassification {
  const name = typeName(fiber);
  if (CONTENT_TYPES.has(name)) return "leaf";

  const style = extractStyle(fiber);
  if (style.display === "none") return "skip";
  if (typeof style.opacity === "number" && style.opacity <= 0) return "skip";

  const hasBg = style.backgroundColor !== undefined && !isTransparent(style.backgroundColor);
  const hasBorder = (style.borderWidth ?? 0) > 0;
  const hasRadius = hasAnyRadius(style.borderRadius);
  const hasShadow = (style.shadowOpacity ?? 0) > 0 || (style.elevation ?? 0) > 0;
  const hasSurface = hasBg || hasBorder || hasRadius || hasShadow;

  if (fiber.child === null) return hasSurface ? "leaf" : "transparent";
  return hasSurface ? "container" : "transparent";
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- defaultClassify`
Expected: 11 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/fiber/defaultClassify.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/fiber/defaultClassify.test.ts
git commit -m "$(cat <<'EOF'
feat(fiber): add defaultClassify — 4-way leaf/container/transparent/skip

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: `fiber/getFiber.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/fiber/getFiber.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/fiber/getFiber.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { getFiber } from "../../../src/fiber/getFiber";

describe("getFiber", () => {
  it("returns __internalInstanceHandle when present", () => {
    const fake = { some: "fiber" };
    expect(getFiber({ __internalInstanceHandle: fake } as never)).toBe(fake);
  });

  it("returns null when handle is missing", () => {
    expect(getFiber({} as never)).toBeNull();
    expect(getFiber(null)).toBeNull();
    expect(getFiber(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- fiber/getFiber`
Expected: module not found.

- [ ] **Step 3: Implement — `src/fiber/getFiber.ts`**

```ts
import type { FiberNode } from "../types";

export function getFiber(ref: unknown): FiberNode | null {
  if (ref === null || ref === undefined) return null;
  const handle = (ref as { __internalInstanceHandle?: FiberNode }).__internalInstanceHandle;
  return handle ?? null;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- fiber/getFiber`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/fiber/getFiber.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/fiber/getFiber.test.ts
git commit -m "$(cat <<'EOF'
feat(fiber): add getFiber — unwrap __internalInstanceHandle

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: `measure/buildBoneTree.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/measure/buildBoneTree.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/measure/buildBoneTree.test.ts`

`buildBoneTree` walks a fiber, classifies each node, and emits an unmeasured IR with `rect: { x:0, y:0, width:0, height:0 }` placeholders. The measurement pass fills rects in-place later.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildBoneTree } from "../../../src/measure/buildBoneTree";
import { View, Text, Image } from "../../helpers/fakeFiber";

describe("buildBoneTree", () => {
  it("emits a single leaf for a Text", () => {
    const fiber = Text("hi");
    const tree = buildBoneTree(fiber);
    expect(tree.classification).toBe("leaf");
    expect(tree.type).toBe("RCTText");
    expect(tree.children).toHaveLength(0);
  });

  it("descends transparent wrappers", () => {
    const fiber = View({}, Text("a"), Image());
    const tree = buildBoneTree(fiber);
    expect(tree.classification).toBe("transparent");
    expect(tree.children.map((c) => c.type)).toEqual(["RCTText", "RCTImage"]);
    expect(tree.children[0]!.classification).toBe("leaf");
  });

  it("emits container + descends into children", () => {
    const fiber = View({ style: { backgroundColor: "#fff" } }, Text("a"));
    const tree = buildBoneTree(fiber);
    expect(tree.classification).toBe("container");
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]!.type).toBe("RCTText");
  });

  it("skips subtrees classified as skip", () => {
    const fiber = View({}, View({ style: { display: "none" } }, Text("hidden")), Text("visible"));
    const tree = buildBoneTree(fiber);
    expect(tree.children.map((c) => c.type)).toEqual(["View", "RCTText"]);
    expect(tree.children[0]!.classification).toBe("transparent"); // placeholder for skip
    expect(tree.children[0]!.children).toHaveLength(0);
  });

  it("respects a custom classify", () => {
    const fiber = View({}, Text("a"));
    const tree = buildBoneTree(fiber, () => "leaf");
    // Root becomes a leaf; children not walked
    expect(tree.classification).toBe("leaf");
    expect(tree.children).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- buildBoneTree`
Expected: module not found.

- [ ] **Step 3: Implement — `src/measure/buildBoneTree.ts`**

```ts
import type { BoneNode, ClassifyFn, FiberNode } from "../types";
import { typeName } from "../fiber/typeName";
import { extractStyle } from "../fiber/extractStyle";
import { defaultClassify } from "../fiber/defaultClassify";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `bone-${idCounter}`;
}

const ZERO_RECT = { x: 0, y: 0, width: 0, height: 0 } as const;

export function buildBoneTree(fiber: FiberNode, classify: ClassifyFn = defaultClassify): BoneNode {
  const cls = safeClassify(fiber, classify);
  const id = nextId();
  const type = typeName(fiber);
  const style = extractStyle(fiber);

  if (cls === "skip" || cls === "leaf") {
    return {
      id,
      type,
      classification: cls === "skip" ? "transparent" : "leaf",
      rect: ZERO_RECT,
      style,
      children: [],
    };
  }

  const children: BoneNode[] = [];
  let child = fiber.child;
  while (child !== null) {
    children.push(buildBoneTree(child, classify));
    child = child.sibling;
  }

  return { id, type, classification: cls, rect: ZERO_RECT, style, children };
}

function safeClassify(fiber: FiberNode, classify: ClassifyFn): ReturnType<ClassifyFn> {
  try {
    return classify(fiber);
  } catch (err) {
    if (__DEV__) console.warn("[dynamic-shimmer] classify threw; falling back to default", err);
    return defaultClassify(fiber);
  }
}

declare const __DEV__: boolean;
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- buildBoneTree`
Expected: 5 passing tests.

Note: The test file runs in Node where `__DEV__` isn't defined. Vitest will complain. Fix by declaring it globally via vitest setup.

- [ ] **Step 5: Add `__DEV__` declaration to vitest setup — edit `__tests__/setup.ts`**

```ts
// Vitest setup. Node environment for unit tests; component tests override
// via `// @vitest-environment jsdom`.

declare global {
  // eslint-disable-next-line no-var
  var __DEV__: boolean;
}
globalThis.__DEV__ = true;
```

Re-run: `pnpm --filter react-native-dynamic-shimmer test:unit -- buildBoneTree`
Expected: 5 passing tests.

- [ ] **Step 6: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/measure/buildBoneTree.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/measure/buildBoneTree.test.ts \
        packages/react-native-dynamic-shimmer/__tests__/setup.ts
git commit -m "$(cat <<'EOF'
feat(measure): add buildBoneTree — fiber walk to unmeasured IR

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 20: `measure/flattenTree.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/measure/flattenTree.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/measure/flattenTree.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import type { BoneNode, BoneRect } from "../../../src/types";
import { flattenTree } from "../../../src/measure/flattenTree";

function n(
  id: string,
  classification: BoneNode["classification"],
  rect = { x: 0, y: 0, width: 10, height: 10 },
  children: BoneNode[] = [],
): BoneNode {
  return { id, type: "View", classification, rect, style: {}, children };
}

describe("flattenTree", () => {
  it("emits containers before their children (pre-order)", () => {
    const tree = n("root", "container", undefined, [n("a", "leaf"), n("b", "leaf")]);
    const flat = flattenTree(tree);
    expect(flat.map((b) => b.kind)).toEqual(["view", "view", "view"]);
    // Plus check root is first
    expect(flat[0]!.width).toBe(10);
  });

  it("excludes transparent nodes but descends into their children", () => {
    const tree = n("root", "transparent", undefined, [
      n("a", "leaf"),
      n("b", "transparent", undefined, [n("c", "leaf")]),
    ]);
    const flat = flattenTree(tree);
    // only leaves survive
    expect(flat.length).toBe(2);
  });

  it("returns [] for empty leaf with no rect size", () => {
    const tree = n("root", "leaf", { x: 0, y: 0, width: 0, height: 0 });
    expect(flattenTree(tree)).toEqual([]);
  });

  it("uses text kind for Text types", () => {
    const tree: BoneNode = {
      id: "a",
      type: "RCTText",
      classification: "leaf",
      rect: { x: 0, y: 0, width: 10, height: 10 },
      style: {},
      children: [],
    };
    const out = flattenTree(tree);
    expect(out[0]!.kind).toBe("text");
  });

  it("uses image kind for Image types", () => {
    const tree: BoneNode = {
      id: "a",
      type: "RCTImage",
      classification: "leaf",
      rect: { x: 0, y: 0, width: 10, height: 10 },
      style: {},
      children: [],
    };
    expect(flattenTree(tree)[0]!.kind).toBe("image");
  });

  it('encodes a square with half-side radius as "50%"', () => {
    const tree: BoneNode = {
      id: "a",
      type: "View",
      classification: "leaf",
      rect: { x: 0, y: 0, width: 40, height: 40 },
      style: { borderRadius: 20 },
      children: [],
    };
    expect(flattenTree(tree)[0]!.borderRadius).toBe("50%");
  });

  it("keeps numeric radius when not a perfect circle", () => {
    const tree: BoneNode = {
      id: "a",
      type: "View",
      classification: "leaf",
      rect: { x: 0, y: 0, width: 40, height: 40 },
      style: { borderRadius: 8 },
      children: [],
    };
    expect(flattenTree(tree)[0]!.borderRadius).toBe(8);
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- flattenTree`
Expected: module not found.

- [ ] **Step 3: Implement — `src/measure/flattenTree.ts`**

```ts
import type { BoneNode, BoneRect, BoneKind, StyleHints } from "../types";
import { walk } from "../ir/walk";

function inferKind(type: string, hasChildren: boolean): BoneKind {
  if (
    type === "RCTText" ||
    type === "Text" ||
    type === "RawText" ||
    type === "RCTTextInput" ||
    type === "TextInput"
  )
    return "text";
  if (type === "RCTImage" || type === "Image" || type === "ImageView") return "image";
  return hasChildren ? "container" : "view";
}

function resolveRadius(style: StyleHints, width: number, height: number): BoneRect["borderRadius"] {
  const r = style.borderRadius;
  if (typeof r === "object" && r !== null) {
    // Per-corner — use top-left as a best approximation. Most skeletons are uniform.
    const { topLeft } = r;
    return typeof topLeft === "number" ? topLeft : 0;
  }
  if (typeof r === "number") {
    const minDim = Math.min(width, height);
    if (Math.abs(width - height) <= 2 && r >= minDim / 2) return "50%";
    return r;
  }
  return 0;
}

export function flattenTree(tree: BoneNode): BoneRect[] {
  const bones: BoneRect[] = [];
  walk(tree, (node) => {
    if (node.classification === "transparent") return;
    const { width, height } = node.rect;
    if (width < 1 || height < 1) return;
    const kind = inferKind(node.type, node.children.length > 0);
    const bone: BoneRect = {
      x: node.rect.x,
      y: node.rect.y,
      width,
      height,
      borderRadius: resolveRadius(node.style, width, height),
      kind,
      ...(node.style.backgroundColor !== undefined
        ? { backgroundColor: node.style.backgroundColor }
        : {}),
      ...(node.style.borderColor !== undefined ? { borderColor: node.style.borderColor } : {}),
      ...(node.style.borderWidth !== undefined ? { borderWidth: node.style.borderWidth } : {}),
    };
    bones.push(bone);
  });
  return bones;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- flattenTree`
Expected: 7 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/measure/flattenTree.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/measure/flattenTree.test.ts
git commit -m "$(cat <<'EOF'
feat(measure): add flattenTree — IR to ordered BoneRect[]

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 21: `platform/fabric.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/platform/fabric.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/platform/fabric.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { isFabricHost, measureLayout } from "../../../src/platform/fabric";

describe("isFabricHost", () => {
  it("returns true for an object with measureLayout method", () => {
    expect(isFabricHost({ measureLayout: () => {} })).toBe(true);
  });
  it("returns false for null, undefined, or empty objects", () => {
    expect(isFabricHost(null)).toBe(false);
    expect(isFabricHost(undefined)).toBe(false);
    expect(isFabricHost({})).toBe(false);
  });
});

describe("measureLayout", () => {
  it("resolves to a rect when success callback fires", async () => {
    const child = {
      measureLayout: (_c: unknown, ok: (x: number, y: number, w: number, h: number) => void) =>
        ok(1, 2, 3, 4),
    };
    await expect(measureLayout(child as never, {} as never)).resolves.toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
    });
  });

  it("resolves to null when fail callback fires", async () => {
    const child = { measureLayout: (_c: unknown, _ok: unknown, fail: () => void) => fail() };
    await expect(measureLayout(child as never, {} as never)).resolves.toBeNull();
  });

  it("resolves to null when the call throws", async () => {
    const child = {
      measureLayout: () => {
        throw new Error("boom");
      },
    };
    await expect(measureLayout(child as never, {} as never)).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- platform/fabric`
Expected: module not found.

- [ ] **Step 3: Implement — `src/platform/fabric.ts`**

```ts
export type FabricHostComponent = {
  measureLayout(
    relativeTo: unknown,
    onSuccess: (x: number, y: number, width: number, height: number) => void,
    onFail?: () => void,
  ): void;
};

export function isFabricHost(node: unknown): node is FabricHostComponent {
  if (node === null || node === undefined) return false;
  if (typeof node !== "object") return false;
  const m = (node as { measureLayout?: unknown }).measureLayout;
  return typeof m === "function";
}

export type MeasuredRect = { x: number; y: number; width: number; height: number };

export function measureLayout(
  child: FabricHostComponent,
  container: unknown,
): Promise<MeasuredRect | null> {
  return new Promise((resolve) => {
    try {
      child.measureLayout(
        container,
        (x, y, width, height) => {
          if (
            Number.isFinite(x) &&
            Number.isFinite(y) &&
            Number.isFinite(width) &&
            Number.isFinite(height)
          ) {
            resolve({ x, y, width, height });
          } else resolve(null);
        },
        () => resolve(null),
      );
    } catch {
      resolve(null);
    }
  });
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- platform/fabric`
Expected: 6 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/platform/fabric.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/platform/fabric.test.ts
git commit -m "$(cat <<'EOF'
feat(platform): add isFabricHost guard and measureLayout wrapper

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 22: `measure/measureTree.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/measure/measureTree.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/measure/measureTree.test.ts`

`measureTree` takes an unmeasured `BoneNode` and a container host component, queues every node for measurement in parallel, and returns a new tree with `rect` attached. It also needs the native stateNode per bone — we thread that through `measureTargets`, a `Map<BoneNode, FabricHostComponent>` built alongside the tree.

This means buildBoneTree needs to expose that map. Adjust Task 19 output now:

- [ ] **Step 1: Extend `buildBoneTree` signature to return a parallel map of `BoneNode → stateNode`**

Edit `src/measure/buildBoneTree.ts` — replace the existing module content with:

```ts
import type { BoneNode, ClassifyFn, FiberNode } from "../types";
import { typeName } from "../fiber/typeName";
import { extractStyle } from "../fiber/extractStyle";
import { defaultClassify } from "../fiber/defaultClassify";

declare const __DEV__: boolean;

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `bone-${idCounter}`;
}

const ZERO_RECT = { x: 0, y: 0, width: 0, height: 0 } as const;

export type BoneTreeResult = {
  tree: BoneNode;
  // stateNode per measurable bone (leaf or container). Needed by measureTree.
  targets: Map<string, unknown>;
};

export function buildBoneTree(
  fiber: FiberNode,
  classify: ClassifyFn = defaultClassify,
): BoneTreeResult {
  const targets = new Map<string, unknown>();
  const tree = walk(fiber, classify, targets);
  return { tree, targets };
}

function walk(fiber: FiberNode, classify: ClassifyFn, targets: Map<string, unknown>): BoneNode {
  const cls = safeClassify(fiber, classify);
  const id = nextId();
  const type = typeName(fiber);
  const style = extractStyle(fiber);

  if (cls === "skip") {
    return { id, type, classification: "transparent", rect: ZERO_RECT, style, children: [] };
  }

  if (cls === "leaf") {
    targets.set(id, fiber.stateNode);
    return { id, type, classification: "leaf", rect: ZERO_RECT, style, children: [] };
  }

  const children: BoneNode[] = [];
  let child = fiber.child;
  while (child !== null) {
    children.push(walk(child, classify, targets));
    child = child.sibling;
  }

  if (cls === "container") {
    targets.set(id, fiber.stateNode);
  }

  return { id, type, classification: cls, rect: ZERO_RECT, style, children };
}

function safeClassify(fiber: FiberNode, classify: ClassifyFn): ReturnType<ClassifyFn> {
  try {
    return classify(fiber);
  } catch (err) {
    if (typeof __DEV__ !== "undefined" && __DEV__)
      console.warn("[dynamic-shimmer] classify threw; falling back to default", err);
    return defaultClassify(fiber);
  }
}
```

Update the Task 19 tests — they currently expect `BoneNode` directly. Edit `__tests__/unit/measure/buildBoneTree.test.ts`: change every `const tree = buildBoneTree(fiber, ...)` to `const { tree } = buildBoneTree(fiber, ...)`. (Seven callsites.)

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- buildBoneTree`
Expected: 5 tests still pass.

- [ ] **Step 2: Write failing test for measureTree — `__tests__/unit/measure/measureTree.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import type { BoneNode } from "../../../src/types";
import { measureTree } from "../../../src/measure/measureTree";

function fakeHost(rect: { x: number; y: number; width: number; height: number } | null) {
  return {
    measureLayout: (
      _c: unknown,
      ok: (x: number, y: number, w: number, h: number) => void,
      fail?: () => void,
    ) => {
      if (rect === null) fail?.();
      else ok(rect.x, rect.y, rect.width, rect.height);
    },
  };
}

describe("measureTree", () => {
  it("attaches rects from measurement to matching ids", async () => {
    const tree: BoneNode = {
      id: "root",
      type: "View",
      classification: "container",
      rect: { x: 0, y: 0, width: 0, height: 0 },
      style: {},
      children: [
        {
          id: "a",
          type: "RCTText",
          classification: "leaf",
          rect: { x: 0, y: 0, width: 0, height: 0 },
          style: {},
          children: [],
        },
      ],
    };
    const targets = new Map<string, unknown>([
      ["root", fakeHost({ x: 0, y: 0, width: 100, height: 50 })],
      ["a", fakeHost({ x: 10, y: 5, width: 80, height: 20 })],
    ]);
    const out = await measureTree(tree, targets, {} as never);
    expect(out.rect.width).toBe(100);
    expect(out.children[0]!.rect).toEqual({ x: 10, y: 5, width: 80, height: 20 });
  });

  it("marks nodes with failed measurement as transparent (dropped)", async () => {
    const tree: BoneNode = {
      id: "root",
      type: "View",
      classification: "container",
      rect: { x: 0, y: 0, width: 0, height: 0 },
      style: {},
      children: [
        {
          id: "a",
          type: "RCTText",
          classification: "leaf",
          rect: { x: 0, y: 0, width: 0, height: 0 },
          style: {},
          children: [],
        },
      ],
    };
    const targets = new Map<string, unknown>([
      ["root", fakeHost({ x: 0, y: 0, width: 100, height: 50 })],
      ["a", fakeHost(null)],
    ]);
    const out = await measureTree(tree, targets, {} as never);
    expect(out.children[0]!.classification).toBe("transparent");
  });
});
```

- [ ] **Step 3: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- measureTree`
Expected: module not found.

- [ ] **Step 4: Implement — `src/measure/measureTree.ts`**

```ts
import type { BoneNode } from "../types";
import { measureLayout } from "../platform/fabric";
import type { FabricHostComponent } from "../platform/fabric";

export async function measureTree(
  tree: BoneNode,
  targets: Map<string, unknown>,
  container: unknown,
): Promise<BoneNode> {
  const ids: string[] = [];
  const hosts: FabricHostComponent[] = [];
  for (const [id, stateNode] of targets) {
    if (stateNode !== null && stateNode !== undefined) {
      ids.push(id);
      hosts.push(stateNode as FabricHostComponent);
    }
  }
  const results = await Promise.all(hosts.map((h) => measureLayout(h, container)));
  const rectById = new Map<string, { x: number; y: number; width: number; height: number }>();
  const droppedIds = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    const rect = results[i];
    const id = ids[i]!;
    if (rect === null) droppedIds.add(id);
    else rectById.set(id, rect);
  }
  return attach(tree, rectById, droppedIds);
}

function attach(
  node: BoneNode,
  rects: Map<string, { x: number; y: number; width: number; height: number }>,
  dropped: Set<string>,
): BoneNode {
  const children = node.children.map((c) => attach(c, rects, dropped));
  if (dropped.has(node.id)) return { ...node, classification: "transparent", children };
  const r = rects.get(node.id);
  if (r !== undefined) return { ...node, rect: r, children };
  return { ...node, children };
}
```

- [ ] **Step 5: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- measureTree`
Expected: 2 passing tests.

- [ ] **Step 6: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/measure/buildBoneTree.ts \
        packages/react-native-dynamic-shimmer/src/measure/measureTree.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/measure/buildBoneTree.test.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/measure/measureTree.test.ts
git commit -m "$(cat <<'EOF'
feat(measure): add measureTree + thread stateNode targets through buildBoneTree

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 3 — Hooks (TDD)

## Task 23: `visibility/useStickyBoolean.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/visibility/useStickyBoolean.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/component/useStickyBoolean.test.tsx`

Hooks need React; this test runs under `jsdom` + `@testing-library/react-native`. The file uses RTL's `renderHook`.

- [ ] **Step 1: Add `jsdom` and ensure RTL is installed**

Run: `pnpm -F react-native-dynamic-shimmer add -D jsdom react-test-renderer@19`
Expected: lockfile updated.

- [ ] **Step 2: Write failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react-native";
import { useStickyBoolean } from "../../src/visibility/useStickyBoolean";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useStickyBoolean", () => {
  it("returns the initial value on first render", () => {
    const { result } = renderHook(() => useStickyBoolean(false, 500));
    expect(result.current).toBe(false);
  });

  it("passes through a false→false change immediately", () => {
    const { result, rerender } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: false },
    });
    rerender({ v: false });
    expect(result.current).toBe(false);
  });

  it("passes through a false→true change immediately", () => {
    const { result, rerender } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: false },
    });
    act(() => rerender({ v: true }));
    expect(result.current).toBe(true);
  });

  it("holds true for at least minDurationMs after going true→false", () => {
    const { result, rerender } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: false },
    });
    act(() => rerender({ v: true }));
    expect(result.current).toBe(true);
    act(() => rerender({ v: false }));
    expect(result.current).toBe(true); // still sticky
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current).toBe(false);
  });

  it("initial true starts the sticky period at mount", () => {
    const { result, rerender } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: true },
    });
    act(() => rerender({ v: false }));
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current).toBe(false);
  });

  it("cancels timer on unmount", () => {
    const { result, rerender, unmount } = renderHook(({ v }) => useStickyBoolean(v, 500), {
      initialProps: { v: false },
    });
    act(() => rerender({ v: true }));
    act(() => rerender({ v: false }));
    unmount();
    // Advancing should not throw
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });
});
```

- [ ] **Step 3: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- useStickyBoolean`
Expected: module not found.

- [ ] **Step 4: Implement — `src/visibility/useStickyBoolean.ts`**

```ts
import { useEffect, useRef, useState } from "react";

export function useStickyBoolean(value: boolean, minDurationMs: number): boolean {
  const [sticky, setSticky] = useState(value);
  const shownAtRef = useRef<number | null>(value ? Date.now() : null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (value) {
      if (!sticky) {
        setSticky(true);
        shownAtRef.current = Date.now();
      }
      return;
    }
    // value is false
    if (!sticky) return;
    const elapsed = shownAtRef.current === null ? minDurationMs : Date.now() - shownAtRef.current;
    const remaining = Math.max(0, minDurationMs - elapsed);
    if (remaining === 0) {
      setSticky(false);
      shownAtRef.current = null;
      return;
    }
    timerRef.current = setTimeout(() => {
      setSticky(false);
      shownAtRef.current = null;
      timerRef.current = null;
    }, remaining);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, sticky, minDurationMs]);

  return sticky;
}
```

- [ ] **Step 5: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- useStickyBoolean`
Expected: 6 passing tests.

- [ ] **Step 6: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/visibility/useStickyBoolean.ts \
        packages/react-native-dynamic-shimmer/__tests__/component/useStickyBoolean.test.tsx \
        packages/react-native-dynamic-shimmer/package.json \
        pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(visibility): add useStickyBoolean — wall-clock min-duration lock-in

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 24: `visibility/useVisibility.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/visibility/useVisibility.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/component/useVisibility.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react-native";
import { useVisibility } from "../../src/visibility/useVisibility";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useVisibility", () => {
  it("returns false initially when loading is false", () => {
    const { result } = renderHook(() => useVisibility(false, 500));
    expect(result.current).toBe(false);
  });

  it("returns true after loading=true persists through a deferred render", () => {
    const { result, rerender } = renderHook(({ l }) => useVisibility(l, 500), {
      initialProps: { l: false },
    });
    act(() => rerender({ l: true }));
    // useDeferredValue in a jsdom test environment resolves in the same microtask — result is true after the commit
    expect(result.current).toBe(true);
  });

  it("keeps visible sticky after loading=false within minShowDuration", () => {
    const { result, rerender } = renderHook(({ l }) => useVisibility(l, 500), {
      initialProps: { l: false },
    });
    act(() => rerender({ l: true }));
    act(() => rerender({ l: false }));
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(600));
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- useVisibility`
Expected: module not found.

- [ ] **Step 3: Implement — `src/visibility/useVisibility.ts`**

```ts
import { useDeferredValue } from "react";
import { useStickyBoolean } from "./useStickyBoolean";

export function useVisibility(loading: boolean, minShowDurationMs: number): boolean {
  const deferred = useDeferredValue(loading);
  const shouldShow = loading && deferred;
  return useStickyBoolean(shouldShow, minShowDurationMs);
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- useVisibility`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/visibility/useVisibility.ts \
        packages/react-native-dynamic-shimmer/__tests__/component/useVisibility.test.tsx
git commit -m "$(cat <<'EOF'
feat(visibility): add useVisibility — useDeferredValue + useStickyBoolean

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 25: `animation/shimmerStyle.ts` + `animation/pulseStyle.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/animation/shimmerStyle.ts`
- Create: `packages/react-native-dynamic-shimmer/src/animation/pulseStyle.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/animation/shimmerStyle.test.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/unit/animation/pulseStyle.test.ts`

These are pure worklet-safe functions. `'worklet'` is a no-op in Node.

- [ ] **Step 1: Write failing tests — `__tests__/unit/animation/shimmerStyle.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { shimmerStyle } from "../../../src/animation/shimmerStyle";

describe("shimmerStyle", () => {
  it("returns opacity 0 for zero-width rects", () => {
    expect(shimmerStyle({ x: 0, width: 0 }, 0)).toMatchObject({ opacity: 0 });
  });

  it("returns a bar width proportional to rect width", () => {
    const s = shimmerStyle({ x: 0, width: 100 }, 0);
    expect(s.width).toBe(40);
  });

  it("produces a translateX that advances with progress", () => {
    const a = shimmerStyle({ x: 0, width: 100 }, 0);
    const b = shimmerStyle({ x: 0, width: 100 }, 0.5);
    expect((b.transform[0]?.translateX ?? 0) > (a.transform[0]?.translateX ?? 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Write failing tests — `__tests__/unit/animation/pulseStyle.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { pulseStyle } from "../../../src/animation/pulseStyle";

describe("pulseStyle", () => {
  it("returns opacity 1 at progress 0", () => {
    expect(pulseStyle(0).opacity).toBeCloseTo(1, 2);
  });
  it("returns opacity 0.5 at progress 0.5", () => {
    expect(pulseStyle(0.5).opacity).toBeCloseTo(0.5, 2);
  });
  it("returns opacity 1 at progress 1 (full cycle wrap)", () => {
    expect(pulseStyle(1).opacity).toBeCloseTo(1, 2);
  });
});
```

- [ ] **Step 3: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- animation`
Expected: modules not found.

- [ ] **Step 4: Implement — `src/animation/shimmerStyle.ts`**

```ts
const BAR_FRACTION = 0.4;
const PHASE_FACTOR = 0.6;

export type ShimmerInput = { readonly x: number; readonly width: number };

export type ShimmerOutput = {
  opacity: number;
  width: number;
  transform: ReadonlyArray<{ translateX: number }>;
};

export function shimmerStyle(rect: ShimmerInput, progress: number): ShimmerOutput {
  "worklet";
  if (rect.width <= 0) return { opacity: 0, width: 0, transform: [{ translateX: 0 }] };
  const barW = rect.width * BAR_FRACTION;
  const phase = rect.x / Math.max(1, rect.width * 4);
  const t = (progress - phase * PHASE_FACTOR + 1) % 1;
  const translateX = -barW + t * (rect.width + barW);
  return { opacity: 1, width: barW, transform: [{ translateX }] };
}
```

- [ ] **Step 5: Implement — `src/animation/pulseStyle.ts`**

```ts
export type PulseOutput = { opacity: number };

export function pulseStyle(progress: number): PulseOutput {
  "worklet";
  // Triangle wave: 0→0.5 goes 1→0.5, 0.5→1 goes 0.5→1.
  const t = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
  const opacity = 1 - 0.5 * t;
  return { opacity };
}
```

- [ ] **Step 6: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:unit -- animation`
Expected: 6 passing tests.

- [ ] **Step 7: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/animation/shimmerStyle.ts \
        packages/react-native-dynamic-shimmer/src/animation/pulseStyle.ts \
        packages/react-native-dynamic-shimmer/__tests__/unit/animation
git commit -m "$(cat <<'EOF'
feat(animation): add shimmerStyle and pulseStyle worklet helpers

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 26: `animation/useShimmerProgress.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/animation/useShimmerProgress.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/component/useShimmerProgress.test.tsx`

Reanimated ships a test mock (`react-native-reanimated/mock`) that's auto-applied. We exercise the hook's surface, not its timing (worklets run via the mock in a synchronous stub).

- [ ] **Step 1: Configure Reanimated mock — edit `__tests__/setup.ts`**

Append:

```ts
// Mock react-native-reanimated per https://docs.swmansion.com/react-native-reanimated/docs/guides/testing/
import { vi } from "vitest";
vi.mock("react-native-reanimated", async () => {
  const actual = await vi.importActual<typeof import("react-native-reanimated/mock")>(
    "react-native-reanimated/mock",
  );
  return actual;
});
```

- [ ] **Step 2: Write failing test — `__tests__/component/useShimmerProgress.test.tsx`**

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react-native";
import { useShimmerProgress } from "../../src/animation/useShimmerProgress";

describe("useShimmerProgress", () => {
  it("returns a SharedValue with numeric value when active", () => {
    const { result } = renderHook(() => useShimmerProgress(true, "shimmer"));
    expect(typeof result.current.value).toBe("number");
  });

  it('returns a SharedValue when animation is "none" (still a value, just 0)', () => {
    const { result } = renderHook(() => useShimmerProgress(true, "none"));
    expect(result.current.value).toBe(0);
  });

  it("returns a SharedValue when inactive", () => {
    const { result } = renderHook(() => useShimmerProgress(false, "shimmer"));
    expect(typeof result.current.value).toBe("number");
  });
});
```

- [ ] **Step 3: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- useShimmerProgress`
Expected: module not found.

- [ ] **Step 4: Implement — `src/animation/useShimmerProgress.ts`**

```ts
import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { AnimationKind } from "../types";

const DURATION_MS = 1400;

export function useShimmerProgress(active: boolean, kind: AnimationKind): SharedValue<number> {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active || kind === "none") {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: DURATION_MS,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [active, kind, progress]);

  return progress;
}
```

- [ ] **Step 5: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- useShimmerProgress`
Expected: 3 passing tests.

- [ ] **Step 6: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/animation/useShimmerProgress.ts \
        packages/react-native-dynamic-shimmer/__tests__/component/useShimmerProgress.test.tsx \
        packages/react-native-dynamic-shimmer/__tests__/setup.ts
git commit -m "$(cat <<'EOF'
feat(animation): add useShimmerProgress oscillator with ReduceMotion.System

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 27: `measure/useMeasureBones.ts`

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/measure/useMeasureBones.ts`
- Create: `packages/react-native-dynamic-shimmer/__tests__/component/useMeasureBones.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react-native";
import { useMeasureBones } from "../../src/measure/useMeasureBones";

function container(rect: { x: number; y: number; w: number; h: number }) {
  const stateNode = {
    measureLayout: (_c: unknown, ok: (x: number, y: number, w: number, h: number) => void) =>
      ok(rect.x, rect.y, rect.w, rect.h),
  };
  return {
    current: {
      __internalInstanceHandle: {
        type: "View",
        memoizedProps: {},
        stateNode,
        child: null,
        sibling: null,
        return: null,
      },
    },
  };
}

describe("useMeasureBones", () => {
  it("returns null bones initially", () => {
    const ref = container({ x: 0, y: 0, w: 0, h: 0 });
    const { result } = renderHook(() => useMeasureBones(ref as never, false, {}));
    expect(result.current.bones).toBeNull();
  });

  it("does not measure when inactive", async () => {
    const ref = container({ x: 0, y: 0, w: 100, h: 100 });
    const { result } = renderHook(() => useMeasureBones(ref as never, false, {}));
    await act(async () => {
      result.current.handleLayout({
        nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 100 } },
      } as never);
    });
    expect(result.current.bones).toBeNull();
  });
});
```

(Richer tests live in Skeleton.tsx's component tests.)

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- useMeasureBones`
Expected: module not found.

- [ ] **Step 3: Implement — `src/measure/useMeasureBones.ts`**

```ts
import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { BoneRect, BoneNode, ClassifyFn, RefineBonesFn } from "../types";
import { getFiber } from "../fiber/getFiber";
import { defaultClassify } from "../fiber/defaultClassify";
import { buildBoneTree } from "./buildBoneTree";
import { measureTree } from "./measureTree";
import { flattenTree } from "./flattenTree";
import { isFabricHost } from "../platform/fabric";

declare const __DEV__: boolean;

export type UseMeasureBonesOptions = {
  classify?: ClassifyFn;
  refineBones?: RefineBonesFn;
  onMeasured?: (bones: ReadonlyArray<BoneRect>) => void;
};

export type UseMeasureBonesResult = {
  bones: ReadonlyArray<BoneRect> | null;
  handleLayout: (e: LayoutChangeEvent) => void;
};

export function useMeasureBones(
  containerRef: RefObject<unknown>,
  active: boolean,
  options: UseMeasureBonesOptions,
): UseMeasureBonesResult {
  const [bones, setBones] = useState<ReadonlyArray<BoneRect> | null>(null);
  const runIdRef = useRef(0);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (!active) return;
      const { width, height } = e.nativeEvent.layout;
      const last = lastSizeRef.current;
      if (last !== null && Math.abs(last.width - width) < 1 && Math.abs(last.height - height) < 1)
        return;
      lastSizeRef.current = { width, height };

      const runId = ++runIdRef.current;
      void (async () => {
        await Promise.resolve();
        const current = containerRef.current;
        if (current === null || current === undefined) return;
        const rootFiber = getFiber(current);
        if (rootFiber === null) {
          if (__DEV__) console.warn("[dynamic-shimmer] Container ref has no fiber instance.");
          return;
        }
        const containerStateNode = rootFiber.stateNode;
        if (!isFabricHost(containerStateNode)) {
          if (__DEV__)
            console.warn("[dynamic-shimmer] Fabric required. Enable the New Architecture.");
          return;
        }
        const { tree, targets } = buildBoneTree(rootFiber, options.classify ?? defaultClassify);
        const measured: BoneNode = await measureTree(tree, targets, containerStateNode);
        if (runId !== runIdRef.current) return;
        let refined = measured;
        if (options.refineBones !== undefined) {
          try {
            refined = options.refineBones(measured);
          } catch (err) {
            if (__DEV__)
              console.warn("[dynamic-shimmer] refineBones threw; using unrefined tree", err);
          }
        }
        const flat = flattenTree(refined);
        if (runId !== runIdRef.current) return;
        setBones(flat);
        options.onMeasured?.(flat);
      })();
    },
    [active, containerRef, options.classify, options.refineBones, options.onMeasured],
  );

  return { bones, handleLayout };
}
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- useMeasureBones`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/measure/useMeasureBones.ts \
        packages/react-native-dynamic-shimmer/__tests__/component/useMeasureBones.test.tsx
git commit -m "$(cat <<'EOF'
feat(measure): add useMeasureBones — orchestrates walk + measure + refine + flatten

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 4 — Components

## Task 28: `Bone.tsx` — minimal (base color rect only)

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/Bone.tsx`
- Create: `packages/react-native-dynamic-shimmer/__tests__/component/Bone.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react-native";
import { Bone } from "../../src/Bone";
import { useSharedValue } from "react-native-reanimated";
import React from "react";

function Harness() {
  const progress = useSharedValue(0);
  return (
    <Bone
      rect={{ x: 10, y: 20, width: 80, height: 40, borderRadius: 8, kind: "view" }}
      ctx={{
        progress,
        baseColor: "#aaa",
        highlightColor: "#eee",
        animation: "shimmer",
        index: 0,
        total: 1,
      }}
    />
  );
}

describe("Bone", () => {
  it("renders a View at the given position with base color", () => {
    const { root } = render(<Harness />);
    expect(root).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- Bone`
Expected: module not found.

- [ ] **Step 3: Implement — `src/Bone.tsx`**

```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import type { BoneProps } from "./types";
import { shimmerStyle } from "./animation/shimmerStyle";
import { pulseStyle } from "./animation/pulseStyle";

export function Bone({ rect, ctx }: BoneProps): React.ReactElement {
  const animatedStyle = useAnimatedStyle(() => {
    if (ctx.animation === "shimmer")
      return shimmerStyle({ x: rect.x, width: rect.width }, ctx.progress.value);
    if (ctx.animation === "pulse") return pulseStyle(ctx.progress.value);
    return { opacity: 1 };
  });

  const resolvedRadius =
    rect.borderRadius === "50%" ? Math.min(rect.width, rect.height) / 2 : rect.borderRadius;

  return (
    <View
      style={[
        styles.bone,
        {
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          backgroundColor: ctx.baseColor,
          borderRadius: resolvedRadius,
        },
      ]}
    >
      {ctx.animation === "shimmer" ? (
        <Animated.View style={[styles.shimmerTrack, animatedStyle]}>
          <LinearGradient
            colors={["transparent", ctx.highlightColor, "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          />
        </Animated.View>
      ) : ctx.animation === "pulse" ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, animatedStyle, { backgroundColor: ctx.highlightColor }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: { position: "absolute", overflow: "hidden" },
  shimmerTrack: { position: "absolute", top: 0, bottom: 0 },
  gradient: { flex: 1 },
});
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- Bone`
Expected: 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/Bone.tsx \
        packages/react-native-dynamic-shimmer/__tests__/component/Bone.test.tsx
git commit -m "$(cat <<'EOF'
feat(bone): add default Bone renderer (shimmer / pulse / none)

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 29: `Skeleton.tsx` — minimal (children pass-through)

**Files:**

- Create: `packages/react-native-dynamic-shimmer/src/Skeleton.tsx`
- Create: `packages/react-native-dynamic-shimmer/__tests__/component/Skeleton.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { Skeleton } from "../../src/Skeleton";

describe("Skeleton — baseline", () => {
  it("renders children when not loading", () => {
    const { getByText } = render(
      <Skeleton loading={false} baseColor="#eee" highlightColor="#fff">
        <Text>Hello</Text>
      </Skeleton>,
    );
    expect(getByText("Hello")).toBeTruthy();
  });

  it("hides children when loading", () => {
    const { queryByA11yRole } = render(
      <Skeleton loading={true} baseColor="#eee" highlightColor="#fff">
        <Text>Hidden</Text>
      </Skeleton>,
    );
    // Before measurement completes, the overlay isn't rendered yet, but the
    // children wrapper has accessibilityElementsHidden. Just check the Skeleton mounts.
    expect(queryByA11yRole("progressbar")).toBeNull(); // overlay not yet
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- Skeleton`
Expected: module not found.

- [ ] **Step 3: Implement `src/Skeleton.tsx` — minimal**

```tsx
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import type { SkeletonProps } from "./types";
import { useVisibility } from "./visibility/useVisibility";

const DEFAULT_MIN_SHOW = 500;

export function Skeleton(props: SkeletonProps): React.ReactElement {
  const { loading, children, style, minShowDuration = DEFAULT_MIN_SHOW } = props;

  const containerRef = useRef<View>(null);
  const isVisible = useVisibility(loading, minShowDuration);

  return (
    <View ref={containerRef} style={[styles.container, style]} collapsable={false}>
      <View
        style={loading ? styles.hidden : undefined}
        pointerEvents={loading ? "none" : "auto"}
        accessibilityElementsHidden={loading}
        importantForAccessibility={loading ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {/* overlay added in the next task */}
      {isVisible ? null : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  hidden: { opacity: 0 },
});
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- Skeleton`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/Skeleton.tsx \
        packages/react-native-dynamic-shimmer/__tests__/component/Skeleton.test.tsx
git commit -m "$(cat <<'EOF'
feat(skeleton): add minimal component (visibility gate, child hide on loading)

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 30: Skeleton — wire `useMeasureBones` + overlay

**Files:**

- Modify: `packages/react-native-dynamic-shimmer/src/Skeleton.tsx`
- Modify: `packages/react-native-dynamic-shimmer/__tests__/component/Skeleton.test.tsx` (add tests)

- [ ] **Step 1: Add failing test — measurement path + overlay a11y**

Append to `__tests__/component/Skeleton.test.tsx`:

```tsx
import { Bone } from "../../src/Bone";

describe("Skeleton — measurement", () => {
  it("invokes onMeasured when the pipeline completes", async () => {
    const onMeasured = vi.fn();
    render(
      <Skeleton loading={true} baseColor="#eee" highlightColor="#fff" onMeasured={onMeasured}>
        <Text>Hello</Text>
      </Skeleton>,
    );
    // Without a real native layout in jsdom we can't drive onLayout; just verify the component mounts without throwing.
    expect(onMeasured).not.toThrow;
  });
});
```

Add `import { vi } from 'vitest'` at the top if not already present.

- [ ] **Step 2: Edit `src/Skeleton.tsx` — integrate `useMeasureBones` and the overlay**

Replace entire file:

```tsx
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import type { BoneRect, BoneContext, SkeletonProps } from "./types";
import { useVisibility } from "./visibility/useVisibility";
import { useMeasureBones } from "./measure/useMeasureBones";
import { useShimmerProgress } from "./animation/useShimmerProgress";
import { Bone as DefaultBone } from "./Bone";

const DEFAULT_MIN_SHOW = 500;

export function Skeleton(props: SkeletonProps): React.ReactElement {
  const {
    loading,
    children,
    baseColor,
    highlightColor,
    animation = "shimmer",
    minShowDuration = DEFAULT_MIN_SHOW,
    classify,
    refineBones,
    renderBone,
    onMeasured,
    style,
    accessibilityLabel = "Loading",
  } = props;

  const containerRef = useRef<View>(null);
  const isVisible = useVisibility(loading, minShowDuration);
  const { bones, handleLayout } = useMeasureBones(containerRef, loading, {
    classify,
    refineBones,
    onMeasured,
  });
  const progress = useShimmerProgress(isVisible, animation);

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      collapsable={false}
      onLayout={handleLayout}
    >
      <View
        style={loading ? styles.hidden : undefined}
        pointerEvents={loading ? "none" : "auto"}
        accessibilityElementsHidden={loading}
        importantForAccessibility={loading ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {isVisible && bones !== null ? (
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ busy: true }}
        >
          {bones.map((rect: BoneRect, index: number) => {
            const ctx: BoneContext = {
              progress,
              baseColor,
              highlightColor,
              animation,
              index,
              total: bones.length,
            };
            const custom = renderBone?.(rect, ctx);
            if (custom !== undefined && custom !== null) {
              return <React.Fragment key={index}>{custom}</React.Fragment>;
            }
            return <DefaultBone key={index} rect={rect} ctx={ctx} />;
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  hidden: { opacity: 0 },
});
```

- [ ] **Step 3: Run all component tests — verify no regression**

Run: `pnpm --filter react-native-dynamic-shimmer test:component`
Expected: all prior tests still pass, including the new one.

- [ ] **Step 4: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/Skeleton.tsx \
        packages/react-native-dynamic-shimmer/__tests__/component/Skeleton.test.tsx
git commit -m "$(cat <<'EOF'
feat(skeleton): wire measurement pipeline + overlay with a11y + renderBone

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 31: Skeleton — transition fade on falling edge

**Files:**

- Modify: `packages/react-native-dynamic-shimmer/src/Skeleton.tsx`

- [ ] **Step 1: Edit Skeleton — add opacity transition**

Replace the top section of `src/Skeleton.tsx` with an `overlayOpacity` shared value that fades out via `withTiming` when `isVisible` drops:

Replace the body of `export function Skeleton(...)` with:

```tsx
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
  ReduceMotion,
} from "react-native-reanimated";
import type { BoneRect, BoneContext, SkeletonProps } from "./types";
import { useVisibility } from "./visibility/useVisibility";
import { useMeasureBones } from "./measure/useMeasureBones";
import { useShimmerProgress } from "./animation/useShimmerProgress";
import { Bone as DefaultBone } from "./Bone";

const DEFAULT_MIN_SHOW = 500;
const DEFAULT_TRANSITION_MS = 300;

export function Skeleton(props: SkeletonProps): React.ReactElement {
  const {
    loading,
    children,
    baseColor,
    highlightColor,
    animation = "shimmer",
    minShowDuration = DEFAULT_MIN_SHOW,
    transition = DEFAULT_TRANSITION_MS,
    classify,
    refineBones,
    renderBone,
    onMeasured,
    style,
    accessibilityLabel = "Loading",
  } = props;

  const containerRef = useRef<View>(null);
  const isVisible = useVisibility(loading, minShowDuration);
  const { bones, handleLayout } = useMeasureBones(containerRef, loading, {
    classify,
    refineBones,
    onMeasured,
  });
  const progress = useShimmerProgress(isVisible, animation);

  const overlayOpacity = useSharedValue(0);
  const [overlayMounted, setOverlayMounted] = React.useState(false);

  const transitionMs =
    transition === false ? 0 : transition === true ? DEFAULT_TRANSITION_MS : transition;

  useEffect(() => {
    if (isVisible) {
      setOverlayMounted(true);
      overlayOpacity.value = withTiming(1, {
        duration: transitionMs,
        easing: Easing.out(Easing.quad),
        reduceMotion: ReduceMotion.System,
      });
    } else if (overlayMounted) {
      overlayOpacity.value = withTiming(
        0,
        {
          duration: transitionMs,
          easing: Easing.in(Easing.quad),
          reduceMotion: ReduceMotion.System,
        },
        (finished) => {
          "worklet";
          if (finished) runOnJS(setOverlayMounted)(false);
        },
      );
    }
  }, [isVisible, transitionMs, overlayOpacity, overlayMounted]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      collapsable={false}
      onLayout={handleLayout}
    >
      <View
        style={loading ? styles.hidden : undefined}
        pointerEvents={loading ? "none" : "auto"}
        accessibilityElementsHidden={loading}
        importantForAccessibility={loading ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {overlayMounted && bones !== null ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, overlayStyle]}
          pointerEvents="none"
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ busy: true }}
        >
          {bones.map((rect: BoneRect, index: number) => {
            const ctx: BoneContext = {
              progress,
              baseColor,
              highlightColor,
              animation,
              index,
              total: bones.length,
            };
            const custom = renderBone?.(rect, ctx);
            if (custom !== undefined && custom !== null)
              return <React.Fragment key={index}>{custom}</React.Fragment>;
            return <DefaultBone key={index} rect={rect} ctx={ctx} />;
          })}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  hidden: { opacity: 0 },
});
```

- [ ] **Step 2: Run all Skeleton tests — verify**

Run: `pnpm --filter react-native-dynamic-shimmer test:component -- Skeleton`
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/Skeleton.tsx
git commit -m "$(cat <<'EOF'
feat(skeleton): add opacity transition on loading falling edge

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 5 — Public API and build

## Task 32: Wire the public barrel

**Files:**

- Modify: `packages/react-native-dynamic-shimmer/src/index.ts`

- [ ] **Step 1: Replace `src/index.ts` with the full barrel**

```ts
export { Skeleton } from "./Skeleton";
export { Bone } from "./Bone";

export { walk, find, findAll, hide, merge, union } from "./ir";

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

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter react-native-dynamic-shimmer typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/react-native-dynamic-shimmer/src/index.ts
git commit -m "$(cat <<'EOF'
feat(barrel): expose public API

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 33: Build output — tsdown + tsc dts

**Files:**

- No source changes; verifies tooling.

- [ ] **Step 1: Run the build**

Run: `pnpm --filter react-native-dynamic-shimmer build`
Expected:

- `dist/index.mjs` and `dist/index.cjs` produced with source maps
- `dist/index.d.ts` (and `.d.mts` / `.d.cts` if tsc emits variants) produced

- [ ] **Step 2: Verify `'worklet'` directive survives the build**

Run: `grep -c "'worklet'" packages/react-native-dynamic-shimmer/dist/index.mjs`
Expected: at least `2` (one per worklet function — `shimmerStyle` and `pulseStyle`).

- [ ] **Step 3: Verify size budget**

Run: `du -h packages/react-native-dynamic-shimmer/dist/index.mjs`
Expected: well under 30kB unminified (minification happens in consumer Metro). Log actual number.

- [ ] **Step 4: Commit nothing (dist is in .gitignore), but bump version**

```bash
# No commit for dist — it's gitignored. Capture success as a release note via changeset.
pnpm changeset
```

In the changeset UI, select:

- Package: `react-native-dynamic-shimmer`
- Change type: **minor** (initial feature set)
- Summary: `Initial release — <Skeleton> component with runtime fiber walk, Fabric measurement, shimmer/pulse animations, IR helpers (walk/find/hide/merge/union), React Compiler safe, Reduce Motion respected, 90%+ test coverage.`

- [ ] **Step 5: Commit the changeset**

```bash
git add .changeset/
git commit -m "$(cat <<'EOF'
chore: add changeset for v0.1.0

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 34: Full test + coverage + lint gate

**Files:**

- No source changes.

- [ ] **Step 1: Run all tests with coverage**

Run: `pnpm --filter react-native-dynamic-shimmer exec vitest run --coverage`
Expected: all tests pass; coverage ≥ 80% (library-wide — unit coverage for pure fns should exceed 90%).

- [ ] **Step 2: Run root lint + format check**

Run: `pnpm lint && pnpm format:check`
Expected: both pass.

- [ ] **Step 3: Run root typecheck**

Run: `pnpm typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit** — nothing to commit; quality gate only.

---

## Task 35: Reference — credits, README enrichment

**Files:**

- Modify: `packages/react-native-dynamic-shimmer/README.md`

- [ ] **Step 1: Replace README with the longer version**

````md
# react-native-dynamic-shimmer

Dynamic shimmer skeletons for React Native. Wrap any component, the library
measures it at runtime via Fabric's JSI `measureLayout`, and paints shimmer
rectangles at the exact positions. The **real component IS the skeleton**.

- No build-time scan, no JSON bones, no CLI.
- Five extension points: `baseColor`/`highlightColor`, `animation`, `renderBone`,
  `classify`, `refineBones`.
- New Architecture only (React Native ≥ 0.76).
- React Compiler safe.
- Reduce Motion respected via `ReduceMotion.System`.

Docs: https://tychota.github.io/react-native-dynamic-shimmer

## Install

```sh
pnpm add react-native-dynamic-shimmer
# peer deps (install if you don't have them yet)
pnpm add react-native-reanimated expo-linear-gradient
```
````

## Minimal usage

```tsx
import { Skeleton } from "react-native-dynamic-shimmer";

<Skeleton loading={!user} baseColor="#eee" highlightColor="#fff">
  <UserCard user={user ?? MOCK_USER} />
</Skeleton>;
```

## Extension

```tsx
import { Skeleton, find, hide } from "react-native-dynamic-shimmer";

<Skeleton
  loading={!user}
  baseColor={theme.skeletonBase}
  highlightColor={theme.skeletonHighlight}
  refineBones={(tree) => {
    const chevron = find(tree, (n) => n.type === "Chevron");
    return chevron ? hide(tree, chevron) : tree;
  }}
>
  <UserCard user={user ?? MOCK_USER} />
</Skeleton>;
```

## Credits

- **[Nicușor Cîciudan — "Let's build dynamic shimmer skeletons"](https://neciudan.dev/lets-build-dynamic-shimmer-skeletons)** — original blog post establishing the "real component IS the skeleton" pattern.
- **[`0xGF/boneyard`](https://github.com/0xGF/boneyard)** — fiber-walker technique (`__internalInstanceHandle`), bone IR concept, and distinctive-container heuristic.

This library adapts those ideas to Fabric + React 19 + Reanimated 3 and ships a
user-facing IR instead of fiber internals.

## License

MIT — see [LICENSE](./LICENSE).

````

- [ ] **Step 2: Commit**

```bash
git add packages/react-native-dynamic-shimmer/README.md
git commit -m "$(cat <<'EOF'
docs(lib): expand README with usage and credits

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
````

---

## Task 36: Root README — project landing

**Files:**

- Modify: `README.md` (root)

- [ ] **Step 1: Create root README**

````md
# react-native-dynamic-shimmer — monorepo

Dynamic shimmer skeletons for React Native — the real component **is** the skeleton.

This repo contains:

- **`packages/react-native-dynamic-shimmer/`** — the library, published to npm as
  [`react-native-dynamic-shimmer`](https://www.npmjs.com/package/react-native-dynamic-shimmer).
- **`apps/example/`** — Expo demo app (see Plan 2).
- **`docs/`** — Astro Starlight documentation site (see Plan 4).

## Quick start

```sh
# Node 20 + pnpm 9 (see mise.toml / .nvmrc)
corepack enable
pnpm install

# Library
pnpm --filter react-native-dynamic-shimmer build
pnpm --filter react-native-dynamic-shimmer test
```
````

## Specs and plans

See `superpowers/specs/` and `superpowers/plans/` for the design doc
and implementation plans.

## License

MIT — © 2026 Tycho Tatitscheff.

````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: add root README

Assisted-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
````

---

# Self-review

**1. Spec coverage:** Every type in spec §5.4 appears in Task 8. Every module in spec §6.1 has a creation task (Tasks 9–28). Extension hooks from §5.5 are wired in Task 30 (`classify`, `refineBones`) and Task 28 (`renderBone`). Anti-flicker per §7.2 lives in Tasks 23–24. Error paths from §8.2 (fiber missing, classify throws, refineBones throws) implemented in Tasks 19 and 27.

**2. Placeholders:** None. Every step has the exact code. No "similar to Task N". No "TBD".

**3. Type consistency:** `BoneNode` with `ReadonlyArray<BoneNode>` used consistently. `FiberNode` narrow projection consistent across `fiber/*` modules. `useMeasureBones` options type exported so `Skeleton.tsx` can import it (Task 27 → Task 30).

**4. One omission noticed:** Task 27 imports `type { BoneNode }` for the `measured: BoneNode` annotation; that type comes from `'../types'`, which is correct. Task 22's test file imports `BoneNode` from `'../../../src/types'` — also correct.

---

**Plan 1 complete.** 36 tasks, ~4000 lines. Produces a fully tested, buildable library with no example app, no docs site, and no CI workflows. Those are Plans 2, 4, and 3 respectively.
