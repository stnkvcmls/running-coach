# P2-2 · Threshold / Critical Power auto-estimation

Derive threshold pace/HR and Critical Power from recent power+pace history
(Stryd-style power-duration analysis), populate the profile, and feed P1-3 zones
+ the AI context.

## Approach

- 2-parameter Critical Power model `P(t) = CP + W'/t`, fit by least squares over a
  duration-bucketed power-duration frontier (max avg-power per duration bin) from
  recent activities. Same model on the velocity-duration frontier yields Critical
  Velocity → threshold pace.
- Threshold HR (LTHR) from sustained hard efforts, with a `% of observed max HR`
  fallback. Max HR from the highest observed activity max.
- Each estimate carries a method, confidence, and sample size; insufficient data
  yields a null value rather than a bad guess.

## Tasks

- [x] `app/threshold.py` — estimation core (CP/W', CV→pace, LTHR, max HR) + AI context formatter
- [x] `app/schemas.py` — `ThresholdEstimateField`, `ThresholdEstimateResponse`, `ThresholdApplyRequest`
- [x] `app/api.py` — `GET /threshold-estimate`, `POST /threshold-estimate/apply`
- [x] `app/ai_coach.py` — surface auto-derived thresholds in `_build_context` when the profile lacks them
- [x] `frontend/src/api/types.ts` + `hooks.ts` — types + query/mutation
- [x] `frontend/src/components/settings/ThresholdEstimateSection.tsx` (+ CSS) wired into `SettingsView`
- [x] `tests/test_threshold.py` — cover the math, edge cases, endpoints
- [x] Run backend tests w/ coverage gate; build + type-check frontend

## Review

- **No migration needed.** Estimates write to the existing `AthleteProfile.threshold_*`
  / `max_hr` columns, so applying an estimate immediately drives the P1-3
  threshold-anchored zones (which read those fields) with zero new schema.
- **`app/threshold.py`** is self-contained: a 2-parameter hyperbolic fit
  (`P(t) = CP + W'/t`) over a duration-bucketed *frontier* (best effort per bin) so
  easy runs don't pull the estimate down; the same model on speed gives Critical
  Velocity → threshold pace; LTHR comes from sustained hard efforts with a
  %-of-max-HR fallback. Non-physical fits (negative asymptote / rising power with
  duration) return `None` rather than a bad number.
- **AI context** gains an "Estimated Thresholds" section listing only the fields the
  athlete hasn't set manually (plus CP/W' when no FTP is configured) — additive,
  never overriding manual entry; wrapped in try/except so a bad estimate can't break
  insight generation.
- **Frontend** adds a read-only estimate card (per-field confidence badges, current
  vs estimated, one-click "Apply to profile") in Settings between Profile and Zones.
- **Tests:** `tests/test_threshold.py` (26 cases) covers the math helpers, each
  estimator, edge/empty/old-data cases, profile application, context formatting, and
  both endpoints. `app/threshold.py` at 98% line coverage; suite total 89% (gate 80%).
  Pre-existing `test_routes.py` failures are an unrelated Jinja-version issue in this
  sandbox and touch none of the changed files.
