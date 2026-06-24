# Running Coach — Improvement Plan (v2)

_Last updated: 2026-06-19_

The previous improvement plan (2026-05-30) has been **fully delivered** — athlete
profile, CTL/ATL/TSB training load, readiness, workout adherence, custom
threshold-anchored zones, Critical-Power/threshold auto-estimation, AI-generated
training plans, wellness trends, data export, a ~270-test suite, AI retry/backoff,
legacy-route removal, and dark mode all now ship. This v2 plan benchmarks the app
**as it exists today** (see [`CURRENT_STATE.md`](./CURRENT_STATE.md)) against the
same competitive set and targets the *next* tier of gaps.

It is a **plan only** — no code has been changed.

---

## 1. Comparison set & central finding

| App | Paradigm | What it does that we don't (yet) |
|---|---|---|
| **Runna** | Adaptive prescriptive plans | **Plan Realignment** when ≥3 sessions / a week are missed; pushes workouts to Garmin/Apple/COROS; strength/yoga/pilates |
| **TrainingPeaks** | Analytical + structured workouts | Pushes structured workouts to the Garmin calendar/device; ACWR & ramp-rate on the dashboard |
| **Garmin Coach / DSW** | Readiness-driven daily adaptation | Training Readiness uses **HRV status** + acute:chronic load ratio; day-to-day suggested workouts; race predictor |
| **Stryd** | Power-based | **Power-Duration Curve** UI + Race Power Calculator (race predictions & pacing from the 90-day curve) |
| **Intervals.icu** | Open analytics | 42-day **power/pace curve**, **time-in-zone** distribution, fitness/fatigue across the season |

**Central finding (v2):** last cycle closed the *derivation* gap — the app now
computes the higher-order metrics (load, readiness, thresholds, CP/CV curves).
The remaining gaps are about **closing the loop and surfacing what's already
computed**:

1. The AI plan is **open-loop** — it doesn't react to whether prior planned
   sessions were actually completed, and there's no realignment when life
   interrupts (Runna/Garmin both adapt).
2. Plans **never reach the watch** — the athlete can't execute the prescription
   on-device (Runna/TrainingPeaks/Garmin all push workouts).
3. Rich data is **computed but invisible** — mean-maximal power/velocity curves
   (`Activity.mean_max_json`) and the CP/CV model are used only internally; no
   power-duration curve, race predictions, ACWR, or time-in-zone view exists.
4. **HRV** — the single biggest input Garmin's readiness uses that we don't sync.

As before, most high-leverage items reuse data **already in the database**.

---

## 2. Gap matrix (today)

Legend: ✓ full · ◑ partial · ✗ absent

| Capability | Running Coach (today) | Runna | TrainingPeaks | Garmin | Stryd | Intervals.icu |
|---|---|---|---|---|---|---|
| Closed-loop / adaptive plan (uses adherence + readiness) | ✗ (open-loop, weekly regen) | ✓ | ◑ | ✓ | ◑ | ◑ |
| Plan "realignment" after missed sessions | ✗ | ✓ | ◑ | ✓ | ◑ | ◑ |
| Push structured workout to device | ✗ | ✓ | ✓ | ✓ | ◑ | ◑ |
| HRV in readiness | ✗ (not synced) | ◑ | ✗ | ✓ | ✗ | ✓ |
| ACWR / ramp-rate / injury flag | ✗ (ATL+CTL exist) | ◑ | ✓ | ✓ | ✗ | ◑ |
| Power-Duration / pace curve UI | ✗ (computed, not shown) | ✗ | ◑ | ◑ | ✓ | ✓ |
| Race-time predictions & pacing | ✗ (Garmin pred. logged only) | ◑ | ◑ | ✓ | ✓ | ◑ |
| Time-in-zone / intensity distribution | ✗ (zones exist) | ◑ | ✓ | ✓ | ◑ | ✓ |
| Per-interval adherence (lap↔step) | ◑ (whole-activity avgs) | ✓ | ✓ | ✓ | ◑ | ◑ |
| Strength / cross-training in plan | ✗ (prompt only) | ✓ | ◑ | ◑ | ✗ | ✗ |

---

## 3. Prioritized improvements

Ordered by **impact ÷ effort**, favoring data already in the DB. Effort key:
**S** ≈ <1 day · **M** ≈ 1–3 days · **L** ≈ several days.

### P0 — High leverage, data already present

#### P0-1 · ACWR + ramp rate + injury-risk flag
**What:** Add Acute:Chronic Workload Ratio (`ATL/CTL`), 7-/28-day ramp rate, and a
"sweet spot" band (≈0.8–1.3) to the training-load model; surface a risk chip on
Today and a band on the load chart; feed it to the AI context.
**Rationale:** TrainingPeaks and Garmin both surface ACWR/ramp as the headline
injury-risk signal. We already compute ATL and CTL — the ratio is essentially free
and turns existing numbers into actionable guidance.
**Effort:** S.
**Files:** `app/training_load.py` (extend `TrainingLoadPoint`/`current_load`, add
`format_*_context`), `app/api.py` (`/training-load`, `/today`), `app/ai_coach.py`
(`_build_context`), `frontend/src/components/today/TrainingLoadChart.tsx` + types.

#### P0-2 · Power-Duration & pace curve view + race predictions
**What:** New endpoint that aggregates per-activity `mean_max_json` into the
athlete's power-duration and velocity-duration curves, overlays the CP/CV model
fit from `app/threshold.py`, and derives **race-time predictions** per standard
distance (5K/10K/HM/M). Also persist Garmin's `projectedRaceTimeDuration…`
(currently only logged at `garmin_sync.py:864`) for comparison. Render a Stryd-style
curve + a race-prediction table.
**Rationale:** Stryd's PDC + Race Power Calculator and Intervals.icu's power curve
are flagship features. The curves and CP/CV model **already exist** and are unused
by the UI — this is pure surfacing of computed data.
**Effort:** M.
**Files:** `app/threshold.py` (reuse fit; add distance→time helper), new
`app/api.py` endpoint (aggregate `Activity.mean_max_json`), `app/garmin_sync.py`
(store race predictions), new `frontend/src/components/trends/*` curve chart +
`hooks.ts`/`types.ts`.

#### P0-3 · Closed-loop plan generation (adherence + readiness aware)
**What:** Feed recent **workout adherence** (from `app/adherence.py`) and
readiness/load trend into `_build_plan_context`, and have generation account for
completed vs missed sessions when shaping the next block.
**Rationale:** Today the plan is regenerated weekly from profile/load/volume but is
blind to whether the athlete actually did the prescribed work — the core of
Garmin DSW and Runna adaptation. Makes the plan genuinely responsive.
**Effort:** M.
**Files:** `app/ai_coach.py` (`_build_plan_context` ~line 954, `generate_training_plan`),
reuse `app/adherence.py` `compute_adherence`/`format_adherence_context`; possibly
link `TrainingPlanDay` ↔ executed `Activity`.

### P1 — Closing the loop & higher fidelity

#### P1-1 · Plan realignment after missed sessions
**What:** Detect when N+ scheduled `TrainingPlanDay`s have passed without a matching
activity and offer "shift / skip / regenerate" — surfaced as a banner on Plan/Today
and an endpoint that triggers an adaptive regen.
**Rationale:** Runna's Plan Realignment; prevents a missed week from invalidating the
whole plan. Builds directly on P0-3.
**Effort:** M.
**Files:** `app/api.py` (realignment endpoint), `app/ai_coach.py` (regen entry),
`frontend/src/components/plan/PlanView.tsx` + `today/*` banner.

#### P1-2 · HRV sync → readiness
**What:** Sync Garmin HRV (overnight/status) into `DailySummary`, add it as a
readiness component, and chart it in Wellness Trends.
**Rationale:** HRV status is a core Garmin Training Readiness factor we omit; the
`garminconnect` lib exposes HRV. Improves the readiness score's fidelity and the AI's
recovery picture.
**Effort:** M.
**Files:** `app/garmin_sync.py` (fetch HRV in daily sync), `app/models.py`
(`DailySummary.hrv*` columns), `app/database.py` (column migration),
`app/training_load.py` (`compute_readiness` weights/component), `app/schemas.py`,
`frontend/src/components/trends/WellnessTrendsView.tsx`.

#### P1-3 · Push structured workouts to the Garmin device
**What:** Translate a `TrainingPlanDay` (or scheduled workout) into a Garmin
structured-workout payload, upload it, and schedule it on the Garmin calendar so it
appears on the watch.
**Rationale:** The single biggest "closing the loop" feature — Runna, TrainingPeaks,
and Garmin all do it. Turns the app from advisory into executable on-device. Reuses the
step grammar already in `app/adherence.py`.
**Effort:** L (new write-path to Garmin; needs careful auth/error handling and a
confidence check on the unofficial API).
**Files:** `app/garmin_sync.py` (new `push_workout`/`schedule_workout`),
new translator module (plan/step → Garmin JSON, mirroring `adherence.parse_workout_steps`),
`app/api.py` (push endpoint), `frontend/src/components/plan/*` + `today/*` "Send to watch".

### P2 — Depth & coaching breadth

#### P2-1 · Time-in-zone / intensity distribution
**What:** Aggregate time in HR/pace/power zones (from detail streams + `ZoneConfig`)
per activity and per week; show polarization (easy/moderate/hard split) and feed it to
the AI.
**Rationale:** Intervals.icu/TrainingPeaks staple; lets the coach judge whether the
athlete is training polarized vs grey-zone. Zones and streams already exist.
**Effort:** M.
**Files:** new helper (reuse `app/streams.parse_streams` + `_classify_by_zones`),
`app/api.py`, `frontend/src/components/trends/*` / `activity-detail/*`,
`app/ai_coach.py` context.

#### P2-2 · Per-interval adherence (lap ↔ step alignment)
**What:** Align executed laps to planned interval steps for per-rep pace/distance
deltas, instead of whole-activity averages.
**Rationale:** Addresses the "adherence is coarse" gap in `CURRENT_STATE.md`; matches
Runna/TrainingPeaks execution grading.
**Effort:** M.
**Files:** `app/adherence.py` (`compute_adherence`), `frontend/src/components/activity-detail/AdherenceCard.tsx`.

#### P2-3 · Strength & cross-training in plans
**What:** Have plan generation prescribe strength/cross days (the `TrainingPlanDay`
`workout_type` already allows `cross`) with concrete guidance, and render them.
**Rationale:** Runna's holistic support; the AI prompt references injury prevention but
the plan surface never prescribes supporting work.
**Effort:** M. **Files:** `app/ai_coach.py` (plan prompt/schema),
`frontend/src/components/plan/*`.

### P3 — Hygiene & scale (largely independent)

- **P3-1 · Cache/incrementalize load & threshold compute** — `training_load` and
  `threshold` recompute from full history per request. Cache a daily series or memoize.
  *Impact: latency as history grows.* **M.** Files: `app/training_load.py`,
  `app/threshold.py`, optional cache table in `app/models.py`.
- **P3-2 · Move the AI model catalog to config** — the selectable model list is
  hard-coded in `app/api.py`; lift to config + validate the stored model is allowed.
  **S.** Files: `app/config.py`, `app/api.py`, `app/ai_coach.py`.
- **P3-3 · Adopt Alembic** — replace the hand-rolled column-add helper in
  `app/database.py` for safe schema evolution. **M.** Files: `app/database.py`, new
  `alembic/`.
- **P3-4 · Auth & multi-user** *(shipped — see `docs/multi_user_plan.md`)* — turns the
  single-tenant app into a real multi-user one in three phases. **Identity:** a
  Cloudflare Access JWT is verified against the team JWKS (`app/auth.py`); the `email`
  claim keys an auto-provisioned `User`. A dev/CI bypass (`auth_enabled=false`) resolves
  to a single `DEV_USER_EMAIL` user so local runs and tests need no Cloudflare.
  **Per-user Garmin:** each user supplies their own credentials in Settings (password
  Fernet-encrypted via `ENCRYPTION_KEY`, tokens under `{garmin_token_dir}/{user_id}/`,
  MFA-aware connect flow); the env account becomes bootstrap user #1.
  **Data isolation:** every data table carries a `user_id` (composite uniques like
  `(user_id, date)`); all queries, compute paths, and the four cron jobs are scoped to
  one user, with the scheduler iterating Garmin-connected users in isolation and flagging
  `needs_reauth` when a cron can't answer an MFA prompt. **M–L.** Files: `app/auth.py`,
  `app/crypto.py`, `app/models.py`, `app/garmin_sync.py`, `app/ai_coach.py`,
  `app/training_load.py`, `app/threshold.py`, `app/intensity.py`, `app/api.py`,
  `app/main.py`, `alembic/`.

---

## 4. Suggested sequencing

- **Phase A — surface what's computed:** P0-1 (ACWR), P0-2 (PDC + race predictions).
  Pure wins on existing data.
- **Phase B — make the plan responsive:** P0-3 (closed-loop) → P1-1 (realignment).
- **Phase C — richer inputs & the watch loop:** P1-2 (HRV), P1-3 (push to device).
- **Phase D — depth:** P2 items. **Throughout:** P3 hygiene in parallel; keep the
  test suite green (coverage gate is 80%).

---

## 5. Sources

- Runna — [Plan Realignment](https://support.runna.com/en/articles/10026375-how-to-use-the-plan-realignment-feature), [Key features](https://support.runna.com/en/articles/10473504-guide-to-key-runna-features), [2026 beginner plans](https://www.runna.com/press/runna-introduces-updated-beginner-running-plans-for-2026)
- TrainingPeaks — [Structured Workout Builder](https://help.trainingpeaks.com/hc/en-us/articles/235164967-Structured-Workout-Builder), [Garmin integration how-to](https://www.trainingpeaks.com/blog/a-quick-how-to-guide-for-trainingpeaks-garmin-users/), [Garmin partner page](https://www.trainingpeaks.com/partners/garmin/)
- Garmin — [Training Readiness factors](https://the5krunner.com/garmin-features/training/training-readiness/), [Training Load (acute/chronic)](https://www.shoulditrain.com/blog/garmin-training-load-explained), [Daily Suggested Workouts](https://the5krunner.com/garmin-features/training/daily-suggested-workouts/)
- Stryd — [Power Duration Curve](https://help.stryd.com/en/articles/6879351-power-duration-curve-pdc), [Race Power Calculator](https://help.stryd.com/en/articles/6879547-race-power-calculator), [Plan/build/execute your race](https://blog.stryd.com/2025/04/15/how-to-plan-build-and-execute-your-best-race-with-stryd/)
- Intervals.icu — [Power Curve](https://www.intervals.icu/features/power-curve/), [Activity Power Charts (time in zone)](https://www.intervals.icu/features/power-charts/), [Fitness/Fatigue/Form](https://www.intervals.icu/features/fitness-chart/)
- Tooling — [python-garminconnect (HRV, race predictions, workout upload/scheduling)](https://github.com/cyberjunky/python-garminconnect)
