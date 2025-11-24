import { defineConfig } from 'vitest/config'

// Exclude Playwright e2e tests from Vitest runs. Without this, Vitest will
// pick up `*.spec.ts` files under `e2e/` and attempt to import them — which
// leads to Playwright's test API being evaluated outside the Playwright
// runner and produces confusing errors like "did not expect test() here".
export default defineConfig({
  test: {
    exclude: ['e2e', 'node_modules'],
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
