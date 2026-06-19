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
