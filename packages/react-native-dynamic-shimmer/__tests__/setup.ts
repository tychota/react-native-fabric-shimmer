// Vitest setup. Node environment for unit tests; component tests override
// via `// @vitest-environment jsdom`.

declare global {
  // eslint-disable-next-line no-var
  var __DEV__: boolean;
}
globalThis.__DEV__ = true;
