# Lessons

## CI: `pytest` vs `python -m pytest` and the `app` import

**Symptom:** Tests passed locally with `python3 -m pytest` but CI failed at
collection with `ModuleNotFoundError: No module named 'app'`.

**Cause:** `python -m pytest` prepends the current directory to `sys.path`, so a
top-level `app` package is importable. The bare `pytest` console script (what CI
ran) does **not** add cwd to `sys.path`, so `from app import ...` in conftest failed.

**Fix:** Add `pythonpath = ["."]` under `[tool.pytest.ini_options]`. pytest inserts
this (relative to rootdir = the config file's dir) into `sys.path` regardless of how
it's launched. Don't rely on the `-m` invocation form to make first-party packages
importable.

**Verify-as-CI tip:** Reproduce the bare-`pytest` path condition by running from a
different cwd (e.g. `cd /tmp && pytest <repo>/tests`) rather than only
`python -m pytest` from the repo root, which masks sys.path issues.

## Frontend: the page/window scrolls, not `<main>` — even though it has `overflowY: auto`

**Symptom:** A Playwright verification script called
`document.querySelector('main').scrollTo(0, 500)` to test a scroll-triggered
feature (Phase 3's sticky activity-detail header). `scrollTop` stayed `0` and
nothing happened, even though `<main>` has `overflow-y: auto` in `App.tsx`.

**Cause:** The app shell (`#root`, and the outer flex div in `App.tsx`) only
sets `min-height: 100dvh`, never `height`/`max-height`. With no hard height
ceiling, `<main>`'s `flex: 1` grows to fit its content instead of being
clamped to the viewport, so `main.scrollHeight === main.clientHeight` (nothing
to scroll internally) and the **window/document** scrolls instead. `BottomNav`
stays pinned via `position: fixed` (viewport-relative, unaffected by which
element technically owns the scrollbar), so this is invisible in normal use —
it only bites JS that assumes `<main>` is the scroll container.

**Fix:** Use `window.scrollTo(...)` / `window.scrollY` (or default-root
`IntersectionObserver`, which tracks the viewport regardless) — not
`main.scrollTop`. This is a pre-existing shell property, not a bug to fix in
each phase; just don't assume `<main>` owns scroll when writing scroll-driven
features or their tests (relevant again for Phase 6's desktop nav-rail work).

## Frontend: `vi.useFakeTimers()` hangs `findBy*`/`waitFor` in a component test

**Symptom:** A test for a date-dependent component (Phase 4's PlanView week
auto-select, which reads `new Date()` to find "today's" week) needs a pinned
clock, so it called `vi.useFakeTimers()` + `vi.setSystemTime(...)` before
`renderWithProviders(...)`, following the `Toast.test.tsx` precedent. Every
`await screen.findByText(...)` in the test then timed out at 5000ms even
though the component rendered correctly.

**Cause:** `vi.useFakeTimers()` with no options fakes `setTimeout` globally,
not just `Date`. Testing Library's `findBy*`/`waitFor` poll via `setTimeout`,
and react-query's fetch-resolution scheduling also rides on real timers/
microtasks — both stall forever once `setTimeout` is faked and nothing calls
`vi.advanceTimersByTimeAsync(...)`. `Toast.test.tsx` gets away with full fake
timers only because it asserts synchronously after `act()`, never awaiting a
`findBy*`.

**Fix:** When a test needs both a pinned clock *and* async data-fetching
queries, fake only `Date`: `vi.useFakeTimers({ toFake: ['Date'] })` before
`vi.setSystemTime(...)`. Real timers keep `findBy*`/react-query working while
`new Date()` inside the component still returns the pinned time. Reach for
this combo any time a later phase's test touches both an async hook and a
"today"/date-range calculation (Phase 5's RangeSelector is a likely repeat).

## Frontend: `personal_records` lives on `ActivityDetail`, not `ActivitySummary`

**Symptom:** Phase 5's records-celebration task (5.4) says "when the Today
payload or activity detail carries fresh PRs (existing `personal_records`),
fire a one-time toast." Wiring a `celebrateNewRecords()` effect into
`TodayView.tsx` (whose `data.activities` are `ActivitySummary[]`) failed
`tsc -b`: `Property 'personal_records' does not exist on type
'ActivitySummary'`.

**Cause:** `personal_records` is declared only on `ActivityDetail extends
ActivitySummary` in `api/types.ts` — the lighter `ActivitySummary` returned by
`/today` and the activities list never carries it, regardless of what a plan
sentence implies by grouping the two surfaces together.

**Fix:** Trust the type system over plan prose: `grep -rn 'personal_records'
frontend/src` before wiring a new consumer would have shown the only existing
reader is `ActivityDetailView.tsx`. When a spec says two surfaces "carry" the
same field, verify both actually declare it before building on the
assumption — and if only one does, implement that one and note the deviation
rather than widening a schema to match the prose (widening `ActivitySummary`
would have meant an out-of-scope backend change).
