# Running Coach — Improvement Plan (v3)

_Last updated: 2026-06-25_

The previous plan (v2, 2026-06-19) has been **fully delivered**. Everything it
targeted now ships and is documented in [`CURRENT_STATE.md`](./CURRENT_STATE.md):
ACWR + ramp-rate injury flags, the power-duration/pace **performance curve** with
race predictions, **closed-loop** (adherence-aware) plan generation, **plan
realignment**, **HRV** sync into readiness, **push-to-Garmin** structured
workouts, **intensity/time-in-zone** trends, load/threshold **caching**,
**Alembic** migrations, and **multi-user auth** with per-user Garmin credentials.

This v3 plan benchmarks the app **as it exists today** against the current (2026)
feature set of the comparable apps and targets the *next* tier of gaps. The
recurring theme has shifted: last cycle was about *deriving and surfacing
metrics*; this cycle is about **interaction, prescription quality, and
forward-looking guidance** — the areas where Runna, TrainingPeaks, and Garmin
have moved in 2026.

It is a **plan only** — no code has been changed.

---

## 1. Comparison set & what each does that we don't (yet)

| App | Paradigm (2026) | Relevant features we lack or only partially have |
|---|---|---|
| **Runna** | Adaptive prescriptive plans + holistic coaching | **In-app AI coach chat** layered on the plan; **fueling planner** + **race-time predictor** + race-day pacing; strength/form/nutrition advice in the same flow |
| **TrainingPeaks** | Analytical platform + AI assistant | **Natural-language AI assistant** (their MCP server) to query CTL/ATL/TSB, build intervals, and manage the calendar conversationally; **predict future form** from scheduled load |
| **Garmin (DSW/perf)** | Readiness-driven daily adaptation | **Daily Suggested Workout** — a single next workout that re-adapts each morning to readiness/load; **PacePro** elevation-aware pacing; endurance score / real-time stamina / running-economy trends |
| **Stryd** | Power-based racing | **Race Power Calculator** — a km-by-km pacing/power strategy for a specific course from the season power-duration curve |
| **Intervals.icu** | Open analytics | **Predict-future-form** chart from planned load; broad **subjective/wellness logging** (RPE, mood, soreness, custom fields); multi-source ingestion (Garmin/Strava/Polar/COROS/Oura/WHOOP) |

**Central finding (v3):** the app already *computes* the higher-order metrics and
*generates* one-shot AI insights and plans. The gaps now are:

1. **The AI is one-shot, not conversational.** Every competitor with an AI angle
   (Runna coach chat, TrainingPeaks assistant) lets the athlete *ask questions*
   of their own data. We generate insights *at* the user but can't be queried.
   This is the single biggest opportunity and plays directly to the app's
   AI-centric identity — and it reuses `_build_context` almost wholesale.
2. **Prescription is weekly and static, not daily and adaptive.** Readiness is
   computed but never *changes the prescription*. Garmin's DSW re-adapts the next
   workout every morning; our plan day is fixed once generated.
3. **No race-execution layer.** We *predict* race times (P0-2 from v2) but give no
   **pacing strategy** or **fueling plan** — the execution half that Stryd's Race
   Calculator, Garmin PacePro, and Runna's fueling planner all provide.
4. **The view is backward-looking.** Load/form charts stop at today; Intervals.icu
   and TrainingPeaks **project form forward** along the scheduled plan. We have the
   plan's TSS-estimable targets and the EWMA model — projection is nearly free.
5. **Plan generation still hinges on free-text JSON.** `CURRENT_STATE.md` flags
   this; structured-output / tool-use would make it robust.

As before, the highest-leverage items reuse data and code **already in the
repo** (`_build_context`, `training_load` EWMAs, `threshold` CV model, `streams`
GAP/Minetti, `estimate_tss`).

---

## 2. Gap matrix (today)

Legend: ✓ full · ◑ partial · ✗ absent

| Capability | Running Coach (today) | Runna | TrainingPeaks | Garmin | Stryd | Intervals.icu |
|---|---|---|---|---|---|---|
| Conversational AI coach (ask your own data) | ✗ | ✓ | ✓ | ✗ | ✗ | ◑ |
| Daily adaptive "next workout" (readiness-flexed) | ✗ (fixed weekly plan) | ✓ | ◑ | ✓ | ◑ | ◑ |
| Race-day pacing strategy (km-by-km / elevation) | ✗ (predicts time only) | ✓ | ◑ | ✓ | ✓ | ◑ |
| Fueling / nutrition guidance | ✗ | ✓ | ◑ | ◑ | ✗ | ✗ |
| Project **future** form from planned load | ✗ (history only) | ◑ | ✓ | ◑ | ◑ | ✓ |
| Robust structured plan generation (tool-use/JSON schema) | ◑ (free-text JSON) | n/a | n/a | n/a | n/a | n/a |
| Subjective wellness / RPE logging → readiness & AI | ◑ (good/bad + tags) | ◑ | ✓ | ◑ | ✗ | ✓ |
| VO2max / endurance / fitness-metric trends | ◑ (stored, not trended) | ✗ | ✓ | ✓ | ◑ | ✓ |
| Per-interval adherence (lap↔step) | ◑ | ✓ | ✓ | ✓ | ◑ | ◑ |
| Multi-source ingestion (beyond Garmin) | ✗ (Garmin only) | ◑ | ✓ | n/a | ◑ | ✓ |
| Durable async AI execution (queue/retry ledger) | ✗ (inline / daemon threads) | n/a | n/a | n/a | n/a | n/a |

---

## 3. Prioritized improvements

Ordered by **impact ÷ effort**, favoring data and code already present. Effort
key: **S** ≈ <1 day · **M** ≈ 1–3 days · **L** ≈ several days.

### P0 — High leverage, mostly reusing existing code/data

#### P0-1 · Conversational AI coach (chat over your own data)
**What:** A `/api/v1/coach/chat` endpoint that takes a user message + short
history, builds the existing rich context via `ai_coach._build_context`, and
returns a grounded answer. Start single-turn-with-history; optionally add
**tool-use** so the model can pull specific slices (an activity, the load series,
the current plan) on demand rather than stuffing everything into context. New
chat view in the SPA.
**Rationale:** Runna's coach chat and TrainingPeaks' natural-language assistant
are *the* 2026 AI differentiators. The app already assembles a coach-grade context
and has a provider-dispatch + retry layer — this is largely wiring existing pieces
into a request/response loop, and it's the feature most aligned with the app's
identity.
**Effort:** M (single-turn) → L (with tool-use + streaming).
**Files:** `app/ai_coach.py` (reuse `_build_context`, `_call_ai`; add a
chat-oriented system prompt and optional tool handlers), `app/api.py` (new chat
endpoint, per-user history in `SyncStatus` or a small `ChatMessage` model in
`app/models.py` + Alembic revision), `app/schemas.py`, new
`frontend/src/components/coach/*`, `frontend/src/api/{hooks,types,client}.ts`,
`App.tsx` route + `layout/BottomNav.tsx`.

#### P0-2 · Race-day pacing + fueling plan
**What:** For an upcoming race (already in `GarminCalendarEvent`), generate a
**km-by-km / segment pacing plan** from the critical-velocity model
(`threshold.get_performance_curve_data`) and, when a course/elevation profile is
available, adjust per-segment targets using the **Minetti grade cost** already in
`app/streams.grade_adjusted_speed`. Layer an AI-generated **fueling/hydration**
note (carbs/hr, gel timing) keyed to predicted duration. Render a pacing table +
target on the race card.
**Rationale:** We predict the finish time but stop short of the execution layer
that Stryd's Race Power Calculator, Garmin PacePro, and Runna's fueling planner
all deliver. The physics (CV/D′ model, Minetti) is already implemented; this is
new assembly + a focused AI call, not new science.
**Effort:** M.
**Files:** `app/threshold.py` (distance/elevation → segment-time helper, reuse
`_predict_race_times`), `app/streams.py` (reuse `grade_adjusted_speed`),
`app/ai_coach.py` (fueling note prompt), `app/api.py` (race-pacing endpoint),
`app/schemas.py`, `frontend/src/components/today/*` (race card) or new
`frontend/src/components/race/*`.

#### P0-3 · Project future form along the plan
**What:** Extend the training-load series **forward** through the active
`TrainingPlan`: convert each future `TrainingPlanDay.target_distance_m`/type into
an estimated TSS (`training_load.estimate_tss` logic) and roll the CTL/ATL/TSB
EWMAs forward to plot predicted Fitness/Fatigue/Form to race day. Show projected
vs actual on the load chart with a "today" divider.
**Rationale:** Intervals.icu and TrainingPeaks both predict form from scheduled
load; it tells the athlete whether the plan peaks them at the right time. We have
both inputs — the EWMA model and the plan's per-day targets — so this is mostly a
forward extension of `_compute_full_series`.
**Effort:** S–M.
**Files:** `app/training_load.py` (forward-projection from plan days),
`app/api.py` (`/training-load` gains a `projected` segment), `app/schemas.py`,
`frontend/src/components/today/TrainingLoadChart.tsx` + types.

### P1 — Prescription quality & responsiveness

#### P1-1 · Daily adaptive workout (readiness-flexed next session)
**What:** A "Today's session" that takes the planned `TrainingPlanDay` and
*adjusts* it to the morning's readiness/load — e.g. downgrade intensity or
trim volume when readiness is low / ACWR is high, hold when fresh — with a
one-line rationale. Surface on Today as the headline card; keep the underlying
weekly plan intact.
**Rationale:** Garmin's Daily Suggested Workout is built on exactly this loop
(fitness + recent load + recovery → today's prescription). We compute readiness
and ACWR already but never let them *modify* the prescription. Closes the gap
between "we have a plan" and "what should I actually do today."
**Effort:** M.
**Files:** `app/ai_coach.py` or a small rules helper (readiness/ACWR → adjustment),
`app/api.py` (`/today` enrichment or new endpoint), `app/schemas.py`,
`frontend/src/components/today/{TodayView,WorkoutCard,ScheduledWorkoutCard}.tsx`.

#### P1-2 · Structured-output / tool-use plan generation
**What:** Replace free-text-JSON plan generation with the provider's structured
output (Anthropic tool-use / JSON-schema response) so the model returns a
schema-validated object instead of text that `_parse_plan_json` must defend
against. Validate against the existing plan schema and surface a clear error when
it can't be produced.
**Rationale:** `CURRENT_STATE.md` flags the JSON-parsing reliance and modest
`max_tokens` as a fragility. Structured output removes the fence-stripping/parse
failure mode and tightens diagnostics — directly hardening a feature users depend
on weekly.
**Effort:** S–M.
**Files:** `app/ai_coach.py` (`generate_training_plan`, `_parse_plan_json`,
`_PLAN_SYSTEM_PROMPT` → tool schema), no DB change.

#### P1-3 · Subjective wellness / RPE logging → readiness & AI
**What:** Let the athlete log per-session **RPE** and a lightweight daily
**wellness check-in** (soreness, motivation, sleep-quality if not from Garmin),
fold RPE into adherence/load (RPE×duration as a session-load cross-check) and the
wellness signals into readiness and the AI context.
**Rationale:** Intervals.icu and TrainingPeaks treat subjective data as a
first-class input; it catches non-physiological fatigue (life stress, illness
onset) that HRV alone misses. We already have an activity-feedback surface to
extend rather than build from scratch.
**Effort:** M.
**Files:** `app/models.py` (RPE on `Activity` or a `WellnessLog` model) + Alembic
revision, `app/training_load.py` (`compute_readiness` weighting; optional sRPE
load), `app/ai_coach.py` (context), `app/schemas.py`,
`frontend/src/components/activity-detail/FeedbackPrompt.tsx` + a daily check-in UI.

### P2 — Depth & breadth

#### P2-1 · Fitness-metric trends (VO2max / endurance / economy)
**What:** Trend the per-activity `vo2max` (already stored) over time and derive
simple endurance/efficiency proxies (e.g. aerobic decoupling from streams,
pace-at-fixed-HR drift) into a Trends view.
**Rationale:** Garmin's performance suite (VO2max, endurance score, running
economy) and Intervals.icu's custom charts make these staples. We store VO2max
but never trend it; decoupling is computable from existing streams.
**Effort:** S–M.
**Files:** `app/api.py` (trend endpoint), reuse `app/streams.parse_streams`,
`frontend/src/components/trends/*` + types/hooks.

#### P2-2 · Per-interval adherence (lap ↔ step alignment)
**What:** Finish aligning executed laps to planned interval steps for per-rep
pace/distance deltas, replacing the residual whole-activity-average leaning noted
in `CURRENT_STATE.md`.
**Rationale:** Matches Runna/TrainingPeaks execution grading and makes the
adherence score trustworthy for structured sessions; the step-parsing grammar and
interval-alignment scaffolding already exist in `app/adherence.py`.
**Effort:** M.
**Files:** `app/adherence.py` (`_align_intervals`/`compute_adherence`),
`frontend/src/components/activity-detail/AdherenceCard.tsx`.

#### P2-3 · Multi-source ingestion (Strava import) — optional
**What:** Allow importing activities from a second source (e.g. Strava) for
athletes who don't run Garmin exclusively, mapping into the existing `Activity`
schema.
**Rationale:** Intervals.icu's broad device/source support is a differentiator and
de-risks the Garmin-only single point of failure flagged in `CURRENT_STATE.md`.
Lower priority — most value accrues to non-Garmin users.
**Effort:** L.
**Files:** new `app/strava_sync.py` (mirroring `garmin_sync` structure),
`app/api.py` (connect/import), `app/models.py` (source field) + Alembic, settings.

### P3 — Hygiene & scale (largely independent)

- **P3-1 · Durable async AI execution.** Replace inline calls and one-shot daemon
  threads (`api.py` analyze/feedback, plan generation) with a small persisted job
  queue + retry ledger so a slow/failed provider call doesn't block a request or
  vanish on restart. Addresses the "synchronous AI on request paths" gap.
  **M–L.** Files: `app/main.py` (worker), `app/models.py` (`Job` table) + Alembic,
  `app/ai_coach.py`, `app/api.py`.
- **P3-2 · Incrementalize load/threshold compute.** Caches exist, but a cache miss
  still recomputes from full history. Persist a daily series and append.
  **M.** Files: `app/training_load.py`, `app/threshold.py`, optional table in
  `app/models.py`.
- **P3-3 · Externalize the model catalog.** `AVAILABLE_MODELS` is hard-coded in
  `app/config.py`; move to env/config so new model IDs don't need a code change.
  **S.** Files: `app/config.py`, `app/api.py`.
- **P3-4 · Garmin contract guards.** Add schema/contract tests around the
  field-name fallbacks in `garmin_sync`/`adherence`/`streams`/`workout_translator`
  so a Garmin API drift fails loudly in CI instead of silently degrading.
  **M.** Files: `tests/*`, small validation helpers.
- **P3-5 · Browse UX.** Infinite scroll / "load all" for activities + daily
  summaries (manual paging today). **S.** Files:
  `frontend/src/components/{activities,daily}/*`, `hooks.ts`.

---

## 4. Suggested sequencing

- **Phase A — make the AI interactive:** P0-1 (coach chat). Flagship; reuses
  `_build_context`. P1-2 (structured plan output) folds in cheaply alongside.
- **Phase B — forward-looking & executable:** P0-3 (project future form) →
  P0-2 (race pacing + fueling). Both reuse existing models/physics.
- **Phase C — daily responsiveness:** P1-1 (daily adaptive workout) → P1-3 (RPE /
  wellness logging) to feed it better inputs.
- **Phase D — depth:** P2 items. **Throughout:** P3 hygiene in parallel —
  P3-1 (async queue) pairs naturally with the new chat workload. Keep the test
  suite green (coverage gate is 80%).

---

## 5. Sources

- Runna — [Key features guide](https://support.runna.com/en/articles/10473504-guide-to-key-runna-features), [App Store listing (coach chat, fueling, race predictor)](https://apps.apple.com/us/app/runna-running-plans-coach/id1594204443), [runna.com](https://www.runna.com/)
- TrainingPeaks — [TrainingPeaks MCP / AI assistant (natural-language CTL/ATL/TSB, build intervals, manage calendar)](https://github.com/JamsusMaximus/trainingpeaks-mcp), [Help Center](https://help.trainingpeaks.com/hc/en-us)
- Garmin — [Daily Suggested Workouts (how the algorithm adapts)](https://the5krunner.com/garmin-features/training/daily-suggested-workouts/), [Performance features: Race Predictor, PacePro, Stamina](https://the5krunner.com/garmin-features/performance/), [Real-Time Stamina](https://the5krunner.com/garmin-features/performance/real-time-stamina/)
- Stryd — [Race Power Calculator](https://help.stryd.com/en/articles/6879547-race-power-calculator), [Power Duration Curve](https://help.stryd.com/en/articles/6879351-power-duration-curve-pdc)
- Intervals.icu — [Fitness, Fatigue & Form (predict future form)](https://www.intervals.icu/features/fitness-chart/), [Wellness Integration (HRV, RPE, custom fields, multi-source)](https://www.intervals.icu/features/wellness/)
- Best-running-apps overview (2026 landscape: tracking/training/fueling) — [mavr.app](https://www.mavr.app/blog/best-running-apps-2026-complete-guide)
