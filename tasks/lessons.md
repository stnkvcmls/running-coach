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
