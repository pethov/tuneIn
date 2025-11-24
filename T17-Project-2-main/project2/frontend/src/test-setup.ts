// Minimal polyfill for ResizeObserver used by components in tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

type GlobalWithResizeObserver = typeof globalThis & { ResizeObserver: typeof ResizeObserver }
;(globalThis as GlobalWithResizeObserver).ResizeObserver = ResizeObserver

// Mock HTMLMediaElement.load (some tests expect this to be callable)
const mediaProto = HTMLMediaElement.prototype
if (typeof mediaProto.load !== 'function') {
  mediaProto.load = () => undefined
}

// Note: do not import '@testing-library/jest-dom' here because it expects
// the testing framework's `expect` to be present. Import it in individual
// test files (or configure Vitest differently) to avoid initialization order
// issues.

// Global cleanup helpers to avoid leaked async work after tests finish.
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(async () => {
  // Run Testing Library cleanup (unmount mounted components)
  try {
    cleanup()
  } catch {
    /* ignore */
  }

  // Clear any timers created during tests
  try {
    vi.clearAllTimers?.()
  } catch {
    /* ignore */
  }

  // Restore mocks to avoid cross-test pollution
  try {
    vi.restoreAllMocks?.()
  } catch {
    /* ignore */
  }

  // Give pending microtasks a chance to settle before the environment is torn down
  await new Promise((res) => setTimeout(res, 0))
})
