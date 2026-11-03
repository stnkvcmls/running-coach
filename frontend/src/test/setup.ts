import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'

// findBy*/waitFor default to 1 s. React Query + Recharts-heavy views can take
// longer when the whole suite runs in parallel on a loaded machine, which made
// a few tests flaky (they always pass in isolation). 5 s still fails fast on a
// genuinely missing element.
configure({ asyncUtilTimeout: 5000 })

// vitest.globals is off, so @testing-library/react's auto-cleanup (which
// looks for a global `afterEach`) never registers itself — do it explicitly.
afterEach(() => {
  cleanup()
})

// jsdom doesn't implement scrollIntoView; ChatView calls it on every message.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom doesn't implement ResizeObserver; Recharts' ResponsiveContainer needs it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom doesn't implement IntersectionObserver; infinite-scroll sentinels and
// the activity detail's sticky-header trigger both construct one. Tests that
// need to simulate intersection changes override this with their own
// vi.stubGlobal('IntersectionObserver', ...) mock.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
    root = null
    rootMargin = ''
    thresholds: number[] = []
  } as unknown as typeof IntersectionObserver
}
