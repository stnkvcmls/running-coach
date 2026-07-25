# Lessons

## Frontend: a follow-up spec can describe a bug that a prior phase already fixed

**Symptom:** The UI/UX follow-up plan's B3 task said "`useActivity(id)` has no
`enabled` guard — add an optional `enabled` (or a guarded wrapper)." Reading
`api/hooks.ts` first showed `useActivity` already has `enabled: id > 0`
(added in an earlier phase). Following the spec literally would have added a
second, redundant guard mechanism for no behavioural gain.

**Cause:** Follow-up specs get written by reviewing code at one point in
time; by the time they're executed the described state may have already
been fixed by an unrelated earlier change (or simply misread during the
review). The instruction's *goal* ("don't fetch when there's no matched
activity") was still correct — only its premise about the current code was
stale.

**Fix:** `ActivityDetailView.tsx` already called `useActivity(Number(id) ||
0)` relying on that exact same guard — passing `matchedActivity?.id ?? 0` in
the new call site reused the existing mechanism instead of adding a parallel
one. Before implementing a described bug, read the current code first; if
it already does what the fix asks for, satisfy the underlying *goal* with
the existing mechanism and note the discrepancy rather than building a
second one anyway "because the spec said so."

## Frontend: CSS Grid `dense` packing shares row-tracks across columns — it isn't masonry

**Symptom:** Phase 6's desktop two-column reflow (`TodayView`/`ActivityDetailView`,
conditionally-rendered sections split into a "left"/"right" visual grouping)
used `display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: row dense;`
with each section assigned only a `grid-column` (1, 2, or full-span), no
`grid-row`. It built and passed all tests, but a real-browser screenshot showed
a large dead gap in the left column: a short item (e.g. an alert banner) sat at
the top of a very tall row because a much taller item (e.g. a big chart) landed
in the *other* column of that same row.

**Cause:** `grid-auto-flow: dense` fills gaps without leaving them *empty*, but
it does not decouple column heights — every cell in row *N* shares row *N*'s
height, which is the tallest cell in that row across **all** columns. Two
conditionally-rendered items that happen to land in the same row-index (one
short, one tall, in different columns) force the short column to inherit the
tall row's height, pushing everything below it down. This is fundamentally
different from masonry (independent per-column stacking); CSS Grid has no
shipped masonry mode.

**Fix:** For independently-conditional content split into visual columns, nest
the actual DOM into real column wrapper `<div>`s and lay them out with
**flexbox** (`display: flex; flex-direction: row` on the pair, `flex-direction:
column` inside each) — flex columns size to their own content only. To avoid
changing the *existing, tested* mobile section order (wrappers necessarily
interleave differently from the original flat document order), make the
wrappers `display: contents` below the desktop breakpoint (so their children
render as one flat in-order stack, unaffected) and restore the original
sequence with an explicit `order` integer per leaf item — CSS `order` sorts
correctly whether the flex context is the single flattened mobile stack or one
of the independent desktop columns, as long as the values are assigned once,
globally, matching original document position. **Remember every full-width
item living *outside* the column wrappers still needs an explicit `order`
higher than every column item** — the un-set default is `order: 0`, which
sorts *before* any item you deliberately numbered 1+, so an unordered trailing
section (e.g. "Insights" placed after the columns) silently jumps to the very
top of the mobile stack instead of staying last.

**Verify-as-real-browser tip:** This class of bug (dead space from shared grid
rows; wrong flattened order from a missed `order` value) is invisible to
jsdom-based component tests — they don't run layout or apply CSS at all. Only
an actual rendered screenshot (Playwright against `vite dev` + a seeded
backend, or `vite preview`) at both the mobile and desktop breakpoint would
have caught the gap or the reordering; run one before considering a CSS-driven
reflow phase done.

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

**Update (UI/UX Follow-up Phase D1):** once widening `ActivitySummary` *was*
in scope (an explicit, additive backend task), the natural next mistake was
reaching for a cheaper `has_pr: bool` existence flag instead of the full
`personal_records: PersonalRecordResponse[]` — the task doc even offered the
boolean as an equally-valid option. But `celebrateNewRecords()` (see
`utils/records.ts`) needs each record's `id` (for its localStorage seen-set,
so a toast fires only once), `achieved_at` (for the 7-day recency window),
and `label`/`display_value` (the toast text) — none of which a boolean
carries. A minimal existence flag is fine for a badge that only ever renders
"yes/no", but the moment a *second* consumer needs the underlying data, check
what that consumer's actual signature requires before picking the
cheaper-looking schema shape.

## Backend: `pywebpush` needs a stub to run `pytest` in a fresh container

**Symptom:** `pip install -r requirements-dev.txt` fails building the
`http-ece` wheel (a `pywebpush` dependency) with `AttributeError:
install_layout` from `setuptools`/`distutils`. Even after installing every
*other* dependency, `pytest` still fails at collection for the **entire**
suite (not just `test_notifications.py`): `app/api.py` imports the
`notifications` router unconditionally at module level, which imports
`pywebpush` at module level too, so one missing package blocks collecting
every test file via `conftest.py`.

**Cause:** `http-ece` has no prebuilt wheel for this Python/setuptools
combination and its `setup.py` doesn't work with the version of `setuptools`
in this container. This is an environment limitation, not a code bug —
`app/notifications.py` is untouched by UI/UX work.

**Fix:** Drop a minimal stub module at
`{site-packages}/pywebpush.py` exposing just the two names
`app/notifications.py` imports (`WebPushException`, `webpush`) before
installing the rest of `requirements-dev.txt` with
`pip install --ignore-installed` (a system-managed `PyJWT` package also
needs `--ignore-installed` to avoid an uninstall-conflict error). This
matches what the redesign review apparently did ("pywebpush was stubbed and
the stub's exception signature differs") — the stub is env-local, never
committed, and only `test_notifications.py`'s assertions about specific
exception shapes should be expected to diverge from a real `pywebpush`.
Exclude only that one file: `pytest tests/ --ignore=tests/test_notifications.py`.

## Frontend: a `position: sticky` descendant of an `overflow-y: auto` container with no bounded height never actually sticks

**Symptom:** The prescribed one-line fix for a "sticky header hides behind
the TopBar" bug (`ActivitiesView.css`'s `.group-head { top: 0 }` →
`top: var(--top-bar-height)`) built, passed all unit tests, and even *looked*
plausible in a single-frame screenshot — but a scroll-position sweep
(`.group-head`'s `getBoundingClientRect().top` sampled across ~10 scrollY
values) showed the header's on-screen position decreasing linearly through
the sticky offset with zero clamping, at every scroll position. The header
never actually stuck to anything; it just scrolled past like ordinary static
content, offset value notwithstanding.

**Cause:** `position: sticky`'s reference frame is the nearest ancestor that
establishes a scroll container (any `overflow` other than `visible`), not
necessarily the visible viewport. `.app-main { overflow-y: auto }` (in
`App.css`) qualifies as that ancestor for `.group-head` — but per an earlier
lesson in this file ("the page/window scrolls, not `<main>`"), `.app-main`
never gets a bounded height anywhere in this shell (`.app-shell` only sets
`min-height`), so `.app-main.scrollHeight` always equals its `clientHeight`
and its own `scrollTop` never moves — the *document* scrolls instead. Sticky
positioning is computed relative to that never-scrolling container, so it
never has anything to clamp against, regardless of the `top` value. Confirmed
with a minimal repro completely outside the app (a bare HTML file: a sticky
child of a bounded-nowhere `overflow-y: auto` div, inside a scrolling
`body`) — same non-stick, proving it's a general CSS mechanic, not
app-specific. This is presumably why `ActivityDetailView`'s own sticky
condensed header deliberately uses `position: fixed` + `IntersectionObserver`
instead of CSS sticky.

**Fix:** `.app-main`'s `overflow-y: auto` (and its paired
`-webkit-overflow-scrolling: touch`) was dead CSS with zero behavioural
effect (proven via `scrollHeight === clientHeight` at every breakpoint) whose
*only* effect was silently breaking sticky descendants — removing it lets
the real containing block (the document) take over, and `position: sticky`
descendants (here and any added later) start working with no other changes.

**Verify-as-real-browser tip:** A single screenshot at one scroll position
cannot distinguish "genuinely stuck" from "just happened to scroll to a
plausible-looking spot." Sample the element's `getBoundingClientRect()`
across a *sweep* of scroll positions and look for a flat plateau at the
sticky offset — a real clamp holds constant across a range; unstuck content
decreases linearly with scroll at every point.

## Frontend: a themeable colour returned as a `var()` string breaks any caller that concatenates onto it

**Symptom:** Nothing-skin QA (`tasks/todo.md`'s Phase 6) found that
`getActivityAccent()` — the function behind the Activity list icon, the
activity-detail badge, `WorkoutCard`, and `MonthCalendar` — still returned
**literal hex** for every non-running sport, so under `nothing-signal` a
cycling activity's icon stayed hard-coded green instead of collapsing to the
one red accent like everything else on the screen.

**Cause:** Three of the four call sites build a translucent badge background
with `` `${color}22` `` — appending a hex alpha byte directly onto the colour
string. That trick requires an actual hex string; it silently produces
invalid CSS (`"var(--color-easy)22"`) if the function is changed to return a
themeable `var(--…)` reference instead, which is exactly why it had been left
as literal hex despite every sibling token (`--color-*`, `--score-*`) already
being skin-aware. The one genuinely unfixable case is different in kind:
`RouteMap` draws to `<canvas>`, and a 2D context's `fillStyle`/`strokeStyle`
never resolves a `var()` reference at all (canvas isn't part of the CSS
cascade) — no string trick fixes that; it has to read the resolved value via
`getComputedStyle()` instead (already done, correctly, for this file).

**Fix:** Switched `getActivityAccent()` to return `var(--color-*)` /
`var(--sport-*)` (new `--sport-*` tokens mirroring the existing `--color-*`
ones), added a literal-hex twin `getActivityAccentHex()` for the canvas
consumer only, and replaced the `` `${color}22` `` sites with
`` `color-mix(in srgb, ${color} 13.333%, transparent)` `` — `color-mix()`
accepts a `var()` as its colour argument and composes fine, unlike string
concatenation. The percentage (not `13%`) was chosen to reproduce `0x22`'s
alpha byte (34/255 = 13.333…%) exactly, verified with a pixel diff against
the pre-change render — an approximate percentage would have been an
invisible-until-diffed regression in the very skin ("default") that's
supposed to stay byte-identical. General rule: before making any colour
value themeable, grep every call site for string interpolation on that
value, not just direct assignment — `background: ${x}` is safe to swap for
`var()`, `` `${x}22` `` or `rgba(...)`-from-parts is not, and a canvas
`fillStyle` never accepts `var()` regardless.

## Frontend: "this must be unaffected" needs a diff against the actual baseline, not a re-check of your own branch

**Symptom:** The Nothing-skin plan's Global Rule 1 ("default skin is sacred
— `data-skin="default"` must render byte-identical to `main`") had been
verified after every phase by re-screenshotting the branch and eyeballing
it. Phase 6's QA pass did the rule literally — screenshotted `origin/main`
in a separate worktree against a live pixel-diff of this branch — and found
Today's default-skin render differed from `main` by ~7–8% of the frame.
Eyeballing alone had missed it across five merged phases.

**Cause:** A Phase 5 follow-up commit ("size the ring to the numeral, not
the numeral to the ring") enlarged `ScoreRing` from 64/72px to 100px at
both call sites (`TodayHero`, `ReadinessCard`) *unconditionally*. The
reasoning was skin-specific — DotMatrix's normal-size digits need a bigger
ring than `default`'s plain-text numeral ever did — but the fix wasn't
gated on skin, so it silently grew the ring (and shifted every card below
it) in the default skin too. A same-branch screenshot never catches this
class of bug: comparing the branch to itself confirms internal consistency,
not fidelity to the untouched baseline.

**Fix:** Gated the ring size on `useSkin()` in both call sites (`size =
skin.startsWith('nothing') ? 100 : 64/72`), restoring the default skin's
original geometry. Verified with `pixelmatch` against an `origin/main` git
worktree running the same backend/data — 6.8%/8.6% of the frame down to
0.155% (a single ring stroke's anti-aliasing, not a layout difference).
When a spec says "X must be unaffected," diff X against the thing it must
match — a worktree of the actual baseline branch is cheap; a re-check of
your own prior screenshots only proves you didn't regress *since your last
screenshot*, which is a much weaker claim.
