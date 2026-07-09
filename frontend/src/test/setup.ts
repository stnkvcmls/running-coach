import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest.globals is off, so @testing-library/react's auto-cleanup (which
// looks for a global `afterEach`) never registers itself — do it explicitly.
afterEach(() => {
  cleanup()
})

// jsdom doesn't implement scrollIntoView; ChatView calls it on every message.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
