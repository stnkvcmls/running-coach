# Running Coach — Improvement Plan

_Last updated: 2026-05-30_

This document benchmarks Running Coach against five comparable training apps, maps the
gaps, and proposes prioritized, concrete improvements. It is a **plan only** — no code has
been changed.

Read alongside [`CURRENT_STATE.md`](./CURRENT_STATE.md), which describes the app as it
exists today.

---

## 1. Methodology & comparison set

The five apps were chosen to span the two dominant paradigms in the running-coach space:

- **Prescriptive coaching** — tells the athlete what to do next: **Runna**, **Garmin Coach**, **Stryd**.
- **Analytical training-load platforms** — model and visualize fitness/fatigue/load: **TrainingPeaks**, **Intervals.icu**.

Each was reviewed specifically for features transferable to *this* app: a single-user,
Garmin-synced, AI-coached, self-hosted tool.

### The central finding

Running Coach already **syncs** most of the raw data the leaders are built on — per-activity
Training Stress Score, Intensity Factor, Normalized Power, sleep duration/score, stress,
resting HR, body battery, and full scheduled-workout step definitions. What it lacks is the
layer that **derives and surfaces** the higher-order metrics those competitors revolve
around: fitness/fatigue/form, training readiness, athlete-specific zones, workout adherence,
and prescriptive plans.

**Consequence:** the highest-leverage improvements are mostly *compute → surface → feed the
AI* on data that already exists in the database, not new Garmin sync work. This keeps effort
low relative to impact.

---

## 2. Competitive landscape

### Runna — adaptive plans + deep personalization
Runna builds a personalized plan from an extensive onboarding quiz (goal race/distance,
current pace, ability, weekly schedule, preferences) and **re-adapts the plan weekly** as the
athlete progresses, adjusts their schedule, or misses sessions. Advanced customization lets
users tune the number of hard runs per week, their intensity, and long-run structure. Beyond
running it offers holistic support: strength & conditioning, nutrition, running form, and
injury management. Integrates with Garmin, Apple Watch, Coros, Strava.

**Relevant to us:** an athlete profile fed from onboarding; adaptive *prescriptive* plans;
surfacing the holistic topics (strength/nutrition/injury) our AI prompt already references but
the UI never exposes.

### TrainingPeaks — the Performance Management Chart
TrainingPeaks centers on the **PMC**, which graphs three derived series from per-workout TSS:
- **CTL** (Chronic Training Load = "Fitness") — 42-day exponentially-weighted average of TSS.
- **ATL** (Acute Training Load = "Fatigue") — 7-day exponentially-weighted average of TSS.
- **TSB** (Training Stress Balance = "Form") — CTL − ATL.

TSS itself is scored from workout duration and intensity relative to threshold (pace, HR, or
power). Tapering shows up as TSB rising into positive territory on race day.

**Relevant to us:** we store `training_stress_score` per activity but never aggregate it.
CTL/ATL/TSB is a near-free win that adds a whole analytical dimension.

### Garmin Coach / Daily Suggested Workouts — readiness-driven adaptation
Garmin's adaptive plans adjust day-by-day using VO2max, lactate threshold, training load
(acute + chronic), recovery time, and sleep, with periodization (base → build → peak → taper
→ race). **Training Readiness** combines recovery time, sleep quality, HRV status, and acute
load into a single morning score (shown in a "Morning Report" with the day's suggested
workout). Daily Suggested Workouts give flexible day-to-day guidance without committing to a
full plan.

**Relevant to us:** a composite **Training Readiness** score is computable today from
`DailySummary` fields we already sync (sleep, stress, resting HR, body battery) plus acute
load — surfaced as a daily card and fed to the AI.

### Stryd — auto-calculated Critical Power & auto-adjusting zones
Stryd automatically derives **Critical Power** from recent training (initial estimate after
~3 runs, and a single-run estimation path) and uses it to set power zones that **auto-adjust
as fitness changes**. Testing plans seed the baseline.

**Relevant to us:** we collect power and pace but use only hardcoded percentile bands for
running-dynamics metrics. We can auto-derive threshold/CP from power+pace history and build
athlete-specific power/pace zones that move with fitness.

### Intervals.icu — analytics, custom zones, openness
A free platform offering the Fitness/Fatigue/Form chart, broad **wellness** tracking (sleep,
HRV, readiness, stress, mood, weight, plus user-defined custom fields), fully **custom zones**
anchored to FTP/LTHR/custom values with time-in-zone analysis, and an **open REST API with
webhooks and data export/import**.

**Relevant to us:** wellness/sleep trend surfacing (our sleep data is synced but unused),
athlete-configurable zones, and data export.

---

## 3. Gap matrix

Legend: ✓ = full, ◑ = partial, ✗ = absent.

| Capability | Running Coach (today) | Runna | TrainingPeaks | Garmin Coach | Stryd | Intervals.icu |
|---|---|---|---|---|---|---|
| Athlete profile / onboarding | ✗ | ✓ | ✓ | ✓ | ◑ | ✓ |
| Adaptive prescriptive plan | ✗ | ✓ | ◑ | ✓ | ◑ | ◑ |
| Fitness/Fatigue/Form (CTL/ATL/TSB) | ✗ (TSS stored, not aggregated) | ◑ | ✓ | ◑ | ✗ | ✓ |
| Training readiness score | ✗ (inputs synced) | ◑ | ✗ | ✓ | ✗ | ◑ |
| Custom / threshold-anchored zones | ✗ (hardcoded percentile only) | ◑ | ✓ | ◑ | ✓ | ✓ |
| Threshold / Critical Power auto-calc | ✗ | ◑ | ◑ | ✓ | ✓ | ◑ |
| Workout adherence (planned vs actual) | ✗ (plan displayed only) | ✓ | ✓ | ✓ | ◑ | ◑ |
| Wellness / sleep analytics | ✗ (synced, unused) | ◑ | ◑ | ✓ | ✗ | ✓ |
| Data export / open API | ✗ | ✗ | ✓ | ◑ | ◑ | ✓ |
| Strength / nutrition / injury support | ✗ (prompt only) | ✓ | ◑ | ◑ | ✗ | ✗ |
| Automated tests / quality harness | ✗ | n/a | n/a | n/a | n/a | n/a |

The pattern is consistent: the columns are full where Running Coach is empty, and most of
our empties are *derivation/surfacing* gaps rather than *data* gaps.

---

## 4. Prioritized improvements

Ordered by **impact ÷ effort**, favoring already-synced data first. Effort key:
**S** ≈ <1 day, **M** ≈ 1–3 days, **L** ≈ several days. Each item lists what it does, why
(with the competitor that validates it), rough effort, and the files it touches.

### P0 — Foundational, high leverage

#### P0-1 · Athlete Profile
**What:** Add an `AthleteProfile` (age, weight, goal race + date, threshold pace/HR, max &
resting HR, injury history, weekly availability, training preferences) with a
settings/onboarding screen, and inject it into the AI context builder.
**Rationale:** Every prescriptive competitor personalizes heavily — Runna's onboarding quiz,
Garmin's physiological inputs. Our AI currently knows *nothing* about the athlete beyond
recent activity data (a `CURRENT_STATE.md` "Notable Gap"). This is the single biggest lever
and a prerequisite for P1-3, P2-1, and P2-2.
**Effort:** M.
**Files:** `app/models.py` (new model), `app/database.py` (migration/seed via existing
column-migration helper), `app/schemas.py`, `app/api.py` (profile GET/POST), `app/ai_coach.py`
(`_build_context`, ~line 237), `frontend/src/api/types.ts` + `hooks.ts`, new
`frontend/src/components/settings/*` profile form + first-run onboarding component.

#### P0-2 · Training Load model (CTL/ATL/TSB)
**What:** A new `app/training_load.py` that computes daily CTL (42-day EWMA), ATL (7-day EWMA),
and TSB from `Activity.training_stress_score`, with an estimated-load fallback (HR- or
pace-based rTSS) for runs lacking power. Surface it as a PMC-style Fitness/Fatigue/Form chart
on Today/Trends, and feed current CTL/ATL/TSB into the AI context.
**Rationale:** The core of TrainingPeaks and Intervals.icu. We already store TSS per activity
but never aggregate it — a high-value, low-data-cost addition that gives the AI a real sense
of fitness trend and freshness.
**Effort:** M.
**Files:** new `app/training_load.py`; optional `DailyLoad` cache table in `app/models.py`;
`app/api.py` (extend `/today`, add a trends endpoint); `app/ai_coach.py` (`_build_context`);
new Recharts component under `frontend/src/components/today/*`; `hooks.ts` + `types.ts`.

### P1 — High impact, builds on P0

#### P1-1 · Training Readiness score
**What:** A composite daily readiness score from `DailySummary` fields (sleep duration/score,
resting HR trend, stress, body battery) combined with acute load (ATL from P0-2). Surface as a
Today "readiness" card and feed it to the AI.
**Rationale:** Garmin's Training Readiness / Morning Report. Every input is already synced —
this directly addresses the "Sleep Data Not Acted On" gap in `CURRENT_STATE.md`.
**Effort:** S–M.
**Files:** helper in `app/training_load.py` (or new `app/readiness.py`); `app/api.py`
(`/today`); `app/ai_coach.py`; `frontend/src/components/today/*`.

#### P1-2 · Workout adherence (planned vs actual)
**What:** Compare a completed activity to its linked `GarminCalendarEvent` workout — planned
vs actual distance, pace, and intervals — reusing the existing step parsers
(`_parse_workout_steps` / `_parse_single_step` in `app/api.py`). Show an adherence summary on
Activity Detail and include it in analysis/feedback context.
**Rationale:** Runna and Garmin grade execution against the plan; we display the scheduled
workout but never compare it ("Workout Adherence Not Tracked" gap).
**Effort:** M.
**Files:** new comparison helper (reusing `app/api.py` step parsers, ~lines 540–726);
`app/ai_coach.py` (`_format_activity_context`, ~line 63); `frontend/src/components/activity-detail/*`.

#### P1-3 · Custom, threshold-anchored zones
**What:** Let the athlete configure HR/pace/power zones anchored to threshold or CP (from the
P0-1 profile / P2-2 estimation), replacing the hardcoded percentile-only bands for those
metrics. Use them in charts, time-in-zone analysis, and AI context.
**Rationale:** Stryd, Intervals.icu, and TrainingPeaks all use athlete-specific zones; ours are
seeded percentile bands the user can't change ("No Custom HR/Power Zones" gap).
**Effort:** M.
**Files:** `app/models.py` (extend `MetricZone` or add `ZoneConfig`); `app/database.py`
(seeding); `app/api.py`; settings UI; `frontend/src/components/activity-detail/*` charts;
`app/ai_coach.py` (`_classify_metric`, ~line 45).

### P2 — Higher effort, transformative

#### P2-1 · AI-generated prescriptive plan
**What:** Use profile + training load + readiness to generate a structured, periodized weekly
plan stored in a new `TrainingPlan` model and rendered in a plan view, with weekly
re-adaptation (a scheduler job alongside the existing weekly review).
**Rationale:** Runna's and Garmin's adaptive plans. This moves the app from purely reactive to
prescriptive — the central gap in `CURRENT_STATE.md` ("No Training Plan / Prescriptive
Features"). It depends on P0/P1 being in place to be credible.
**Effort:** L.
**Files:** `app/models.py`; `app/ai_coach.py` (new generation function near `weekly_review`,
~line 670); `app/api.py`; `app/main.py` (scheduler hook); new `frontend/src/components/plan/*`.

#### P2-2 · Threshold / Critical Power auto-estimation
**What:** Derive threshold pace/HR and Critical Power from recent power+pace history
(Stryd-style power-duration analysis), populating the profile and feeding P1-3 zones.
**Rationale:** Stryd's auto-calculated CP; removes manual threshold entry and keeps zones
current as fitness changes.
**Effort:** M–L.
**Files:** new `app/threshold.py`; `app/models.py` (store on profile); `app/ai_coach.py`;
`app/api.py`.

#### P2-3 · Wellness & sleep trends view
**What:** A dedicated trends view charting sleep, resting HR, stress, and body battery over
time.
**Rationale:** Intervals.icu wellness tracking; finally *acts on* the synced-but-unused sleep
data beyond the readiness score.
**Effort:** S–M.
**Files:** `app/api.py`; new `frontend/src/components/trends/*`; `hooks.ts` + `types.ts`.

### P3 — Hygiene & openness (largely independent)

#### P3-1 · Data export
**What:** CSV/JSON export endpoints for activities and insights, with a download control in
Settings.
**Rationale:** Intervals.icu's openness; addresses the "No Data Export" gap.
**Effort:** S. **Files:** `app/api.py`; settings UI.

#### P3-2 · Test harness
**What:** pytest for the backend, Vitest for the frontend, wired into CI.
**Rationale:** Zero tests today ("No Tests" gap). This is a prerequisite for safely shipping
the P0–P2 changes — ideally land before P2.
**Effort:** M. **Files:** new `tests/`, `pyproject.toml`/`pytest.ini`, frontend Vitest config,
a GitHub Actions workflow.

#### P3-3 · AI error handling & retry
**What:** Distinguish transient vs fatal failures, add backoff/retry, and improve the user-
facing message.
**Rationale:** "AI Error Handling is Thin" gap. **Effort:** S. **Files:** `app/ai_coach.py`
(`_save_error_insight`, `_call_ai`).

#### P3-4 · Remove legacy Jinja routes/templates
**What:** Delete the deprecated `/legacy` Jinja routes and templates now superseded by the SPA.
**Rationale:** "Legacy Code Debt" gap (~431 dead lines). **Effort:** S. **Files:** delete
`app/routes.py` and `app/templates/`, unwire in `app/main.py`.

#### P3-5 · Dependency & model refresh
**What:** Bump `anthropic` off the pinned `0.42.0` and verify configured model IDs
(`claude-opus-4-7`, `claude-sonnet-4-6`) are current.
**Rationale:** "Anthropic SDK Version" gap. Verify against release notes rather than blind-
bumping (the SDK has breaking changes across minors). **Effort:** S. **Files:**
`requirements.txt`, `app/config.py`, `app/ai_coach.py`.

#### P3-6 · Dark mode
**What:** Add a theme toggle and dark palette.
**Rationale:** "No Dark Mode" gap; low-stakes UX polish. **Effort:** S. **Files:**
`frontend/src/components/layout/*` + theme/styles.

---

## 5. Suggested sequencing

- **Phase A — context foundation:** P0-1 (Athlete Profile) + P0-2 (Training Load). Immediately
  enriches every AI insight and unlocks later work.
- **Phase B — surfacing synced data:** P1-1 (Readiness), P1-2 (Adherence), P1-3 (Custom Zones).
  All build on Phase A and mostly use data already in the DB.
- **Phase C — the prescriptive leap:** P2-1 (Plan generation), P2-2 (Threshold/CP), P2-3
  (Wellness trends).
- **Throughout:** P3 hygiene items run in parallel. **Land P3-2 (tests) before Phase C.**

---

## 6. Sources

- Runna — [Personalized training plans](https://www.runna.com/training/training-plans),
  [Custom distance plans](https://www.runna.com/training/custom-distance-training-plan),
  [Training preferences](https://support.runna.com/en/articles/10393191-how-to-use-training-preferences-in-the-runna-app),
  [Adjusting your schedule](https://support.runna.com/en/articles/6206024-adjusting-your-running-schedule)
- TrainingPeaks — [Performance Management Chart](https://help.trainingpeaks.com/hc/en-us/articles/204071874-Performance-Management-Chart-PMC),
  [A Coach's Guide to ATL, CTL & TSB](https://www.trainingpeaks.com/coach-blog/a-coachs-guide-to-atl-ctl-tsb/),
  [Thresholds 411](https://www.trainingpeaks.com/learn/articles/thresholds-411/)
- Garmin Coach — [Overview](https://www.garmin.com/en-US/garmin-coach/overview/),
  [Training plans for runners](https://www.garmin.com/en-US/blog/fitness/garmin-training-plans-for-runners/),
  [Daily Suggested Workouts](https://www.garmin.com/en-US/garmin-technology/running-science/physiological-measurements/daily-suggested-workouts-feature/),
  [Coach vs Daily Suggested Workouts](https://www.wareable.com/garmin/garmin-coach-vs-daily-suggested-workouts-key-differences)
- Stryd — [Auto-calculated Critical Power](https://blog.stryd.com/2019/07/09/introducing-auto-calculated-critical-power/),
  [Single-run CP estimation](https://blog.stryd.com/2025/02/20/new-feature-update-start-power-based-training-with-stryd-after-just-one-run/),
  [Critical Power definition](https://help.stryd.com/en/articles/6879345-critical-power-definition)
- Intervals.icu — [Home](https://www.intervals.icu/),
  [Fitness, Fatigue & Form chart](https://www.intervals.icu/features/fitness-chart/),
  [Wellness integration](https://www.intervals.icu/features/wellness)
