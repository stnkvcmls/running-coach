# P1-2 · HRV sync → readiness  +  overnight-data date-attribution fix

## Plan
- [x] Sync Garmin overnight HRV (`get_hrv_data`) into `DailySummary`
      (`hrv_avg`, `hrv_weekly_avg`, `hrv_status`) + DB migration.
- [x] Add an HRV readiness component (last-night HRV vs personal baseline, with a
      status-enum fallback); rebalance weights to include HRV at 0.20.
- [x] Surface HRV: Wellness-Trends chart card, Today readiness component bar, AI
      daily-summary context line, `format_readiness_context`.
- [x] Fix overnight date attribution: scheduled daily sync now covers a rolling
      window (today + prior `daily_sync_window_days-1` days) so last night's
      sleep/HRV — which Garmin dates to the wake-up day — lands on the correct date
      the morning you sync, while earlier days' full-day totals finalize. Backfill
      now starts at today (`days_ago=0`).
- [x] Tests: garmin_sync HRV persistence, readiness HRV component (baseline ratio,
      status fallback, composite fold-in), rolling-window daily sync + AI-on-today,
      backfill-includes-today. Full suite 351 passing, coverage 83.4% (gate 80%).
      Frontend `npm run build` (tsc) clean.

## Review / findings — was sleep correctly dated?
Garmin attributes overnight metrics (sleep, HRV, resting HR) to the **wake-up
calendar date** (confirmed via Garmin Developer Portal `calendarDate` definition):
sleep from the night of Jun 19→20 is dated **Jun 20**. The data the app stored was
internally consistent (it reused Garmin's own date), but `sync_daily_summary()`
defaulted to **yesterday** and the 7am job called it with no argument — so waking up
on Jun 20 and syncing pulled Jun 19's row, and last night's sleep/HRV wasn't captured
until the *next* morning. The sync **window** was a day behind. Fixed by the rolling
window above: today's row now captures last night's overnight stats on the wake-up
day, and prior days are re-synced so their daytime totals finalize.

---

# P2-2 precision upgrade — mean-maximal curves + proper CP/CV modeling

Move threshold estimation off whole-activity averages and onto real
power-/velocity-duration curves extracted from the per-second streams the app
already syncs (stored in `Activity.laps_json` via `get_activity_details`).

## Changes (all backend, minimal frontend)

1. **`app/streams.py` (new)** — parse Garmin detail streams (`metricDescriptors` /
   `activityDetailMetrics`), spike-reject, grade-adjust pace (Minetti cost-of-running),
   and compute a per-activity **mean-maximal curve** (best time-weighted average power /
   GAP-speed / HR over standard durations). Plus a backfill helper for already-synced
   activities.
2. **`app/models.py` + `app/database.py`** — add `Activity.mean_max_json` column +
   migration. Compact (~a few dozen numbers/activity), so estimates never re-parse blobs.
3. **`app/garmin_sync.py`** — raise stream resolution (`maxchart`) and drop the unused
   polyline (`maxpoly=0`); compute + store `mean_max_json` on sync.
4. **`app/threshold.py` (rewrite estimators)** —
   - Aggregate per-duration **frontier** (best across activities) from the curves.
   - **Weighted** 2-parameter fit `P=CP+W'/t` over the valid 2–40 min range, with
     recency weighting so CP tracks current fitness.
   - **3-parameter Morton fit** (adds Pmax) via a bounded, scipy-free search, used only
     when it converges in physiological bounds and fits better; W' clamped.
   - **Critical Velocity** on the **grade-adjusted** speed frontier → threshold pace.
   - **LTHR**: prefer Garmin's lactate-threshold HR if present → else steady-state HR of
     sustained near-CV segments (drift-corrected) → else %-of-max fallback.
   - Quality filtering (runs only, exclude treadmill from pace, min duration) and
     per-field **confidence + guidance note** (e.g. "needs a short maximal effort").
5. **`app/schemas.py` + frontend** — add `note` (+ `pmax`) to the estimate response and
   surface the note in the Settings card.
6. **Tests** — `tests/test_streams.py` (parsing, GAP, mean-max, backfill) and expanded
   `tests/test_threshold.py` (frontier fit, 2-/3-param recovery, LTHR paths, notes).

## Tasks
- [x] app/streams.py
- [x] models + migration
- [x] garmin_sync wiring + backfill
- [x] threshold.py rewrite
- [x] schemas + frontend note
- [x] tests + coverage gate
- [x] frontend build + type-check

## Review

- **`app/streams.py`**: parses Garmin detail streams by descriptor key, rebases
  timestamp axes, spike-rejects power/speed/HR, grade-adjusts speed via the Minetti
  cost-of-running curve, and computes time-weighted mean-maximal curves (handles the
  non-uniform sampling that downsampled streams produce). `backfill_missing_curves`
  self-heals pre-existing rows.
- **Storage**: one compact `Activity.mean_max_json` column (a few dozen numbers), added
  via the existing column-migration helper — estimates never re-parse raw blobs.
- **Sync**: `get_activity_details` now requests `maxchart=10000, maxpoly=0` (high
  resolution at the short end, no wasted GPS polyline) and stores curves on ingest.
- **`app/threshold.py`**: builds per-duration frontiers across recent runs; weighted
  2-parameter CP/CV fit (recency-decayed) over the valid 2–40 min window; a guarded,
  scipy-free 3-parameter Morton refinement (adds Pmax, only used when it fits ≥5%
  better in physiological bounds); CV uses grade-adjusted speed; LTHR prefers Garmin's
  lactate-threshold HR, then drift-corrected steady HR of sustained near-CV segments,
  then sustained-effort avg, then %max. Per-field confidence + guidance notes; W'/D'
  clamped; treadmills excluded from pace but kept for power.
- **API/frontend**: response gains `pmax` + per-field `note`; the Settings card shows
  W'/Pmax and renders the guidance notes.
- **Tests**: `tests/test_streams.py` (19) + rewritten `tests/test_threshold.py` (25)
  cover parsing, GAP, mean-max, backfill, frontier fit, 2-/3-param recovery, all LTHR
  paths (incl. stream-segment), filtering, notes, endpoints. streams.py 90% /
  threshold.py 93% line coverage; suite total 89% (gate 80%). Pre-existing
  `test_routes.py` Jinja failures are unrelated to these files.

### Why this is now precise
The model fits the athlete's actual power-/velocity-duration curve (best sustained
effort *per duration*, extracted from within each run) instead of whole-run averages,
which is the input CP/CV models require. GAP removes terrain bias from threshold pace,
recency weighting tracks current fitness, and confidence/notes flag when the available
efforts don't yet constrain the fit (e.g. no short maximal effort).

---

# Performance test suite (every API endpoint, real seeded DB)

Benchmark all 28 routes in `app/api.py` against a committed 3-year SQLite
database, on every PR, with results published to GitHub.

## Done
- [x] `perf/seed_perf_db.py` → committed `perf/perf.db` (~4.5 MB): ~295 run
      days/yr, ~3,600 km/yr, 1,095 daily summaries, profile/insights/
      calendar/plan/sync rows. Deterministic; self-asserts the brief.
- [x] `perf/conftest.py` — copies the DB to a temp path + binds `DB_PATH`
      before app import (never mutates the artifact); stubs ai_coach/garmin_sync.
- [x] `perf/test_perf_endpoints.py` — 30 `pytest-benchmark` cases (28 routes;
      exports x2 for csv/json). Reads first, idempotent mutations last.
- [x] `.github/workflows/performance.yml` — PR job: run benchmarks, write a
      `$GITHUB_STEP_SUMMARY` table, publish via github-action-benchmark
      (trend history on gh-pages + PR comment + placeholder alert threshold).
- [x] `requirements-perf.txt`, `docs/performance-testing.md`, `.gitignore`
      (commit `perf/perf.db`, ignore WAL sidecars/output.json).

## Review
- All 30 benchmarks pass locally; latencies are meaningful and differentiated
  (export-activities-csv ~185 ms heaviest, threshold ~80 ms, today ~50 ms).
- Default `pytest` collects only `tests/` (0 perf items) — main suite untouched.
- Threshold deliberately not enforced yet (`fail-on-alert: false`); documented
  how to tighten `alert-threshold` and flip it on later.
