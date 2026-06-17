# P0-2 · Training Load model (CTL/ATL/TSB)

Compute Fitness (CTL), Fatigue (ATL), Form (TSB) from per-activity TSS, surface a
PMC-style chart on Today, and feed the current snapshot into the AI context.

## Backend
- [x] `app/training_load.py` (new) — per-activity TSS with estimation fallback
      (power → pace-rTSS → hr-TSS → duration), daily EWMA series (CTL 42d, ATL 7d,
      TSB = CTL − ATL), `current_load()`, and AI-context formatter.
- [x] `app/schemas.py` — `TrainingLoadPoint`, `TrainingLoadResponse`; add
      `training_load` snapshot to `TodayResponse`.
- [x] `app/api.py` — `GET /training-load` trends endpoint; include current snapshot in `/today`.
- [x] `app/ai_coach.py` — inject `## Training Load` section into `_build_context`
      (+ a system-prompt line on reading CTL/ATL/TSB together).

## Frontend
- [x] `frontend/src/api/types.ts` — TrainingLoad types + `training_load` on TodayResponse.
- [x] `frontend/src/api/hooks.ts` — `useTrainingLoad`.
- [x] `frontend/src/components/today/TrainingLoadChart.tsx` (+ css) — Recharts PMC chart.
- [x] `frontend/src/components/today/TodayView.tsx` — render the chart section.

## Tests
- [x] `tests/test_training_load.py` — TSS estimation, EWMA series, current snapshot,
      AI-context injection, `/training-load` + `/today` endpoints (12 tests).

## Verification
- [x] `pytest -q` → 20 passed (12 new + 8 pre-existing)
- [x] `tsc --noEmit` clean + `npm run build` succeeds

## Review

Implemented P0-2 (Training Load model, CTL/ATL/TSB) end-to-end and within scope.

**Backend:** New `app/training_load.py` derives per-activity TSS, preferring the
stored power `training_stress_score` and falling back through pace-based rTSS →
HR-based hrTSS → a duration-only floor so non-power runs still contribute. It
builds a daily EWMA series (CTL = 42-day, ATL = 7-day, both via the
`alpha = 1 − exp(−1/N)` impulse-response form TrainingPeaks uses) seeded from the
first activity, with TSB = CTL − ATL. `current_load()` returns the latest snapshot;
`compute_load_series()` returns the trailing window. The estimators use the
`AthleteProfile` thresholds from P0-1 (with `max_hr × 0.9` as a threshold-HR
fallback). `_build_context` inserts a `## Training Load` section (Fitness/Fatigue/
Form + a plain-language form reading) right after the profile, and a system-prompt
line teaches the coach to read the three series together.

**API:** `GET /training-load?days=&date=` returns points + current; `/today` now
carries a `training_load` snapshot computed as of the selected date.

**Frontend:** `TrainingLoadChart` (Recharts `ComposedChart`) shows a 90-day PMC —
CTL area, ATL line, TSB line on a secondary axis with a zero reference — plus three
headline stat tiles and a colour-coded Form badge. Rendered on Today only when a
snapshot exists; the headline uses the `/today` snapshot while the chart pulls the
series from the dedicated endpoint.

**Tests:** 12 new pytest tests cover TSS estimation (all four sources + zero-
duration), EWMA seeding, window capping, fatigue decay on rest, AI-context
injection (present/absent), and both endpoints. Full suite: 20 passed.

**Notes / out of scope:** Chose a same-day `TSB = CTL − ATL` (matching the plan's
stated definition) over TrainingPeaks' yesterday-based variant — simpler and within
the doc. No `DailyLoad` cache table: the series recomputes cheaply for a single user.
The pre-existing Pydantic `Config` deprecation warnings and the bundle-size warning
(recharts) were left untouched to stay in scope.
