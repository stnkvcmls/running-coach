# Running Coach — Implementation Plan (v6)

_Last updated: 2026-07-11_

This plan benchmarks the app **as it exists today** (post-v5, post-UI/UX
redesign + follow-ups — see [`CURRENT_STATE.md`](./CURRENT_STATE.md),
[`IMPROVEMENT_PLAN.md`](./IMPROVEMENT_PLAN.md) and
[`UI_UX_REDESIGN_REVIEW.md`](./UI_UX_REDESIGN_REVIEW.md)) against the
competitive set the request named — **Garmin Connect, Strava, Runna, HumanGO
("Hugo"), TrainingPeaks** — plus the adjacent tools the v5 cycle tracked
(Stryd, Intervals.icu, Coach Leo). Every gap below was verified against the
actual source (routers, schemas, models, frontend components), not just the
docs.

It is a **plan only** — no code has been changed.

---

## 1. Where the app stands

The v3–v5 plans and the seven-phase UI/UX redesign (plus follow-up Phases A–D1)
are fully delivered. Today the app already has genuine parity — or an edge —
on the *coaching intelligence* axis:

- **At or beyond parity:** a conversational coach that acts (chat tool-use) and
  remembers (`CoachMemory`); readiness-driven daily adaptation with
  risk/check-in triggers; per-run RPE + daily subjective check-in feeding sRPE
  load and readiness; conditions- and terrain-aware race pacing pushable to the
  watch; pre-workout briefings; Web Push proactive notifications; PR/best-effort
  detection with celebration; season periodization; season-over-season curve
  comparison; multi-sport load accounting; custom charts; a health/observability
  panel; a redesigned 5-tab mobile-first PWA with desktop layouts, error
  boundary, and 212 frontend + ~1000 backend tests.

- **Where the field has moved past us** is no longer intelligence — it is
  **platform openness, athlete control, and lifecycle coverage**:

  1. **The app is a Garmin-only silo.** There is no manual activity entry, no
     FIT/GPX/TCX import, no per-activity file export (`app/routers/export.py`
     exposes exactly two CSV/JSON summary endpoints), and no second data
     source. Every competitor ingests from multiple sources and lets data out
     again. A broken Garmin sync (a real, monitored fragility — see the schema
     canary) currently means *no data at all*, and a treadmill/track session
     with no watch simply doesn't exist.
  2. **The athlete can't touch the plan.** `app/routers/plan.py` has
     regenerate / adapt-day / realign / push-to-Garmin — but no way to *move* a
     workout to Tuesday, swap two days, skip one with a reason, or build a
     custom workout. Runna, HumanGO, and TrainingPeaks all treat
     move/edit/drag-drop as table stakes; our only lever is "regenerate the
     whole plan via AI".
  3. **Races are read-only and end at the finish line.** The `Race` model
     exists but has **no CRUD endpoints** — races exist only if Garmin's
     calendar has them. And nothing happens after a race: no goal-vs-actual
     report, no plan-vs-executed pacing comparison, no automatic recovery
     reset. Runna's 2026 cycle shipped exactly this (race-day guidance +
     post-race recovery setup).
  4. **Motivation mechanics stop at PRs.** No goals, no streaks, no
     weekly/monthly recap, no shareable summary. Strava and Garmin have made
     these the retention baseline.
  5. **Everything is metric.** No unit preference exists anywhere in
     `app/schemas.py` or the frontend — a US athlete cannot use the app in
     miles (pacing splits are the sole km/mi-aware surface).

---

## 2. Competitor snapshot (mid-2026)

| App | Paradigm | What it does that we don't (yet) |
|---|---|---|
| **Garmin Connect (+ Active Intelligence)** | Device ecosystem + AI companion | **Training status vocabulary** (productive / maintaining / detraining / peaking), VO2max + race predictor as headline numbers, gear/shoe mileage with replacement alerts, goals & badges, multi-source import (FIT upload), full data export |
| **Strava (2026)** | Social + analysis layer | **Athlete Intelligence** zone/pattern insights (we match this), **auto workout analysis** — interval/structure detection on *unplanned* runs, matched-runs progress on repeated routes, best-effort PRs (we match), goals/streaks/recaps, share cards, route builder, Claude/MCP data access, universal import/export |
| **Runna (2026)** | Prescriptive adaptive plans | **Plan continuity** ("build on previous training"), **move/edit individual workouts**, race-week & race-day guidance, **post-race recovery setup**, weather-adjusted sessions (we match), pace insights that push/pull targets from demonstrated performance, mileage-consistency graph |
| **HumanGO ("Hugo")** | AI-native multi-sport planner | **Recalibration/benchmark tests** (1–2-day fitness assessments that update thresholds & zones automatically), schedule-aware auto-rescheduling ("knows when you're slacking and reschedules"), genuinely multi-sport goal stacking, coach dashboards |
| **TrainingPeaks Premium** | Analytical + structured training | **Drag-and-drop workout builder + personal workout library**, calendar-level plan editing, HRV-modulated plan variants, Peak Performances (we match), the PMC (we match), universal import/export, coach marketplace |

**Central finding (v6):** the coaching brain is competitive; the *chassis*
around it is not. The highest-leverage work is no longer another model or
metric — it is **letting data in and out, letting the athlete steer the plan,
closing the race lifecycle, and finishing the motivation loop**. Almost all of
it reuses machinery that already exists (`workout_translator`, `streams.py`,
`adherence.py`, `season_plan.py`, the AI job queue, the push channel, the
threshold-review flow).

---

## 3. Gap matrix (today)

Legend: ✓ full · ◑ partial · ✗ absent

| Capability | Running Coach (today) | Garmin | Strava | Runna | HumanGO | TrainingPeaks |
|---|---|---|---|---|---|---|
| Multi-source / manual activity import (FIT/GPX/TCX) | ✗ (Garmin sync only) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Per-activity file export (GPX/TCX/FIT) | ✗ (CSV/JSON summaries) | ✓ | ✓ | ◑ | ◑ | ✓ |
| Manual race calendar (create/edit/delete) | ✗ (`Race` model has no endpoints) | ✓ | ◑ | ✓ | ✓ | ✓ |
| Move / swap / skip / edit individual plan days | ✗ (whole-plan regenerate only) | ◑ | n/a | ✓ | ✓ | ✓ (drag-drop) |
| Custom structured-workout builder + library | ✗ | ✓ | ✗ | ◑ | ✓ | ✓ (flagship) |
| Post-race report + recovery reset | ✗ (taper/recovery *phases* only) | ◑ | ◑ | ✓ (2026) | ✓ | ◑ |
| Benchmark / recalibration test workouts | ✗ (passive CP fit only) | ◑ (auto) | ✗ | ◑ | ✓ | ◑ |
| Auto interval/structure detection on unplanned runs | ✗ (adherence needs a planned workout) | ◑ | ✓ | ✗ | ◑ | ✓ |
| Training-status vocabulary (productive/detraining…) | ◑ (TSB bands, EF trend — never labelled) | ✓ | ◑ | ✗ | ◑ | ◑ |
| VO2max-style headline fitness number | ◑ (CP/CV + race predictions; no familiar unit) | ✓ | ◑ | ◑ | ◑ | ◑ |
| Goals, streaks, monthly recap | ✗ | ✓ | ✓ | ◑ | ◑ | ✗ |
| Gear / shoe mileage tracking | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Repeated-route ("matched runs") progress | ✗ | ◑ | ✓ | ✗ | ✗ | ✗ |
| Imperial units preference | ✗ (metric hardcoded) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Activity share card / summary image | ✗ | ✓ | ✓ | ✓ | ◑ | ✗ |
| Personalized environment response (own heat model) | ✗ (population Ely coefficients) | ◑ (acclimation) | ✗ | ◑ | ✗ | ✗ |
| Conversational coach that acts + remembers | **✓** | ◑ | ◑ | ◑ | ✓ | ✗ |
| Readiness/feel-driven daily adaptation | **✓** | ✓ | ✗ | ◑ | ✓ | ◑ |
| Conditions + terrain race pacing → watch | **✓** | ◑ | ✗ | ◑ | ✗ | ✗ |
| Proactive push coaching | **✓** | ✓ | ◑ | ◑ | ◑ | ◑ |

Deliberately **out of scope** (unchanged from v5, re-affirmed): social
feed/segments/clubs/leaderboards (needs a user network we don't have), live
tracking & audio cues during a run (needs a native app; the watch itself covers
in-run guidance via pushed structured workouts), food logging/macros, native
iOS/Android apps, a coach marketplace, and language i18n (units yes — see
U-1 — translations no).

---

## 4. Prioritized improvements

Ordered by **impact ÷ effort** within four themes. Effort key: **S** ≈ <1 day ·
**M** ≈ 1–3 days · **L** ≈ several days. File paths reflect the post-P3-1
layout (`app/routers/*`, `app/coach/*`).

### Theme A — Own your data (import, export, races)

#### A-1 · Activity file import (FIT/GPX/TCX) + manual activity entry
**What:** Break the Garmin-only silo. (a) `POST /activities/import` accepts a
FIT, GPX, or TCX file (multipart), parses it into the existing `Activity` +
detail-stream shape, and runs the **same post-sync pipeline** live sync uses
(mean-max curves, decoupling/EF, PR detection, training-load dirty-date, AI
analysis enqueue) so an imported run is indistinguishable from a synced one.
(b) `POST /activities` creates a minimal manual entry (sport, date, duration,
distance, optional avg HR + RPE) for treadmill/track/no-watch sessions — sRPE
TSS (P1-1, delivered) already makes these carry honest load. Add
`Activity.source` (`garmin` / `file` / `manual`) so sync reconciliation can
skip non-Garmin rows and the UI can label them. Dedupe on
`(user_id, started_at ±2 min, distance ±2%)` to survive "imported the file,
then Garmin synced it too."
**Rationale:** Every competitor ingests from anywhere; we ingest from exactly
one fragile API (the schema canary exists *because* it's fragile). Import is
also the app's disaster-recovery story and its migration path for new users
with non-Garmin history. The heavy machinery — stream parsing, curve compute,
PRs, load — is already source-agnostic once the file is normalized; the new
code is only the parsers and the endpoint.
**Effort:** L (FIT is the bulk; GPX/TCX are simple XML).
**Files:** `app/importers.py` (new — `fitdecode`/`gpxpy` parsing →
normalized activity dict + samples), `app/routers/activities.py`
(`POST /activities/import`, `POST /activities`), `app/models.py`
(`Activity.source`) + migration, `app/schemas.py`, `app/garmin_sync.py`
(extract the reusable post-ingest hook it currently owns), `requirements.txt`,
`frontend/src/components/activities/ImportActivitySheet.tsx` + manual-entry
form (new), `frontend/src/api/{client,types,hooks}.ts`,
`tests/test_importers.py` (new, fixture files), `tests/test_api_endpoints.py`.

#### A-2 · Per-activity GPX/TCX export + full-account archive
**What:** (a) `GET /activities/{id}/export?format=gpx|tcx` reconstructs a track
from the stored detail streams (time/lat-lon if present, else time/distance/HR)
— streams are already parsed and aligned in `app/streams.py`. (b)
`GET /export/archive` streams a ZIP: all activities (JSON + GPX where
possible), daily summaries, insights, chat history, plans, PRs — the
"leave with everything" guarantee a self-hosted app should be best at.
**Rationale:** Data-out is the flip side of A-1 and philosophically core to a
self-hosted product; today a user's own detail streams are locked in
`detail_json`. Small, well-bounded, no new deps (stdlib `zipfile`,
hand-rolled GPX/TCX templates).
**Effort:** S–M.
**Files:** `app/exporters.py` (new), `app/routers/export.py`,
`frontend/src/components/activity-detail/ActivityDetailView.tsx` (export menu),
`settings/DataSection` (archive button), `tests/test_exporters.py` (new).

#### A-3 · Manual race management (CRUD + goal editing)
**What:** `POST/PATCH/DELETE /races` over the existing `Race` model (name,
date, distance, goal time, priority A/B/C), a "Add race" flow in the UI
(Plan or Today → races strip), and merge manual races into every consumer that
today reads only `GarminCalendarEvent`: race countdowns, season-plan goal-race
selection (`season_plan.py`'s race resolution chain), pacing
(`/races/{id}/pacing` already keys on the model), fuelling, race-week pushes.
**Rationale:** The single most basic thing a running app does — "I'm racing a
10K on Sept 20" — currently requires the athlete to own a Garmin *and* register
the race in Garmin's calendar. The model, the pacing engine, and the season
planner all exist; this is endpoints + a form + widening one selection query.
**Effort:** S.
**Files:** `app/routers/races.py` (CRUD), `app/season_plan.py` (include manual
races in goal selection), `app/routers/daily.py` (countdowns), `app/schemas.py`,
`frontend/src/components/plan/RaceFormSheet.tsx` (new), races strip edit
affordances, `tests/test_api_endpoints.py`, `tests/test_season_plan.py`.

#### A-4 · Unit preference (km ↔ miles)
**What:** A per-user `units` preference (`metric` / `imperial`) on
`AthleteProfile`, a Settings toggle, and frontend conversion at the formatting
layer — `frontend/src/utils/formatting.ts` is already the single choke point
(~16 consumer files use `formatPace`/`formatDistance`), so the API stays
metric-native and only display converts. Pacing already supports mile splits
(`pacing.py` takes a unit); wire the preference through as its default. Chart
axes/tooltips read the same helpers via `chartTheme`.
**Rationale:** Metric-only walls off the largest running market; every
competitor handles this. Doing it now is much cheaper than after more surfaces
accumulate.
**Effort:** M (mechanical but wide; the utils centralization keeps it sane).
**Files:** `app/models.py` (`AthleteProfile.units`) + migration,
`app/routers/settings.py`, `frontend/src/utils/formatting.ts` (unit-aware),
`frontend/src/api/types.ts`, Settings toggle, sweep of direct "km" literals,
`frontend/src/utils/formatting.test.ts` (imperial cases).

### Theme B — Let the athlete steer the plan

#### B-1 · Plan-day editing: move, swap, skip, resize
**What:** Four verbs on `TrainingPlanDay`, all athlete-initiated:
`POST /training-plan/days/{id}/move` (to another date in the same plan,
swapping with the day that's there), `.../skip` (with a reason chip: travel /
illness / life), and a `PATCH` for target distance (±, capped vs the week
target). UI: a "⋯" menu on Plan day rows and the Today hero (move to
tomorrow / swap with tomorrow / skip). Record every edit in a small
`PlanDayEdit` audit trail and **feed it into the AI context** ("athlete moved
Thursday's tempo to Friday; skipped Monday: travel") so the next generation
respects the athlete's demonstrated schedule instead of fighting it — Runna's
"plan continuity" insight applied at day granularity. Edited days re-push to
Garmin automatically if they were already pushed.
**Rationale:** This is the loudest gap for anyone coming from Runna/HumanGO/
TrainingPeaks: our only response to "I can't run Tuesday" is a chat round-trip
(`adjust_upcoming_week` tool) or full regeneration. Direct manipulation is
faster than conversation for scheduling, and chat remains the right tool for
*why*-level changes. The state machine (`planDayState.ts`), adherence matching,
and push-to-watch all key off `day_date` and continue to work unchanged.
**Effort:** M.
**Files:** `app/routers/plan.py` (move/skip/patch endpoints),
`app/models.py` (`PlanDayEdit`, `TrainingPlanDay.skipped_reason`) + migration,
`app/coach/context.py` + `app/coach/plans.py` (edit history in
generation/chat context), `app/workout_translator.py` (re-push hook),
`app/schemas.py`, `frontend/src/components/plan/PlanDayMenu.tsx` (new),
`PlanView.tsx`, `TodayHero`, `frontend/src/api/{types,hooks}.ts`,
`tests/test_api_endpoints.py`, `frontend/src/components/plan/PlanDayMenu.test.tsx`.

#### B-2 · Custom workout builder + personal workout library
**What:** A `WorkoutTemplate` model (name, sport, structured steps in the
existing `WorkoutStepResponse` shape: warmup / repeat×N / work / recovery /
cooldown with duration-or-distance ends and pace/HR targets), CRUD endpoints,
and a builder UI (reuse `WorkoutStructureBar` for live preview — its mixed
time/distance weighting was fixed in follow-up C4). Templates can be
(a) scheduled onto a plan day (replacing the AI prescription, recorded as a
B-1 edit) and (b) **pushed to the watch** — `workout_translator.py` already
converts exactly this structure to Garmin's payload. Seed a starter library
(classic sessions: 6×800, Mona fartlek, progression long run…) the same way
`strength_routines.py` seeds strength.
**Rationale:** TrainingPeaks' flagship premium feature and the standard answer
to "my coach/club gave me a session." We are unusually close: the step schema,
the structure-bar renderer, the translator, and the adherence engine (which
already parses nested repeats) all exist — the missing 20% is a table, CRUD,
and a form.
**Effort:** M–L (the builder form is most of it).
**Files:** `app/models.py` (`WorkoutTemplate`) + migration,
`app/routers/plan.py` or new `app/routers/workouts.py` (CRUD + schedule +
push), `app/workout_translator.py` (template → payload path),
`app/strength_routines.py`-style seed module, `app/schemas.py`,
`frontend/src/components/workout-builder/` (new: `WorkoutBuilderView.tsx`,
`StepEditor.tsx`), Plan integration, `frontend/src/api/{types,hooks}.ts`,
`tests/test_workout_templates.py` (new), `tests/test_workout_translator.py`.

#### B-3 · Structured steps on AI plan days (redesign follow-up D2) + planned-volume overlay (D3)
**What:** The two data-enrichment items the UI/UX follow-up deliberately
deferred. (a) Have plan generation emit optional structured `workout_steps`
for interval/tempo days (extend the structured-output schema in
`app/coach/plans.py`; persist as `TrainingPlanDay.steps_json`), falling back
to the current free-text description — this lights up the already-built
`WorkoutStructureBar` on Plan rows and the Today hero (review items T2/P3, the
largest remaining mockup gap), makes watch pushes higher-fidelity than the
current description-derived translation, and gives adherence a real step
definition for AI-planned days. (b) Add `planned_km` per week bucket to the
Today payload so `WeekOverview` can render the mockup's planned-outline bars
(actual vs planned at a glance — Runna's consistency graph, one week at a
time).
**Rationale:** Closes the loop between three delivered systems (plan
generation, structure bars, adherence) that currently can't talk to each other
for AI-generated days; pure additive schema work the frontend already knows
how to consume.
**Effort:** M.
**Files:** `app/coach/plans.py` (schema + prompt), `app/models.py`
(`TrainingPlanDay.steps_json`) + migration, `app/adherence.py` (accept plan-day
steps), `app/workout_translator.py` (prefer structured steps),
`app/routers/daily.py` (`planned_km`), `app/schemas.py`,
`frontend/src/components/today/WeekOverview.tsx`, `PlanView` rows + `TodayHero`
(render bars when steps exist — code paths already guarded),
`tests/test_ai_coach.py`, `tests/test_adherence.py`.

### Theme C — Close the race & fitness lifecycle

#### C-1 · Post-race report + recovery reset
**What:** When a synced activity matches a race day (calendar event or A-3
manual race, same-day + distance within tolerance): (a) enqueue a **race
report** `AIJob` — goal vs actual, planned pacing splits (the stored pacing
strategy) vs executed splits, positive/negative split analysis, conditions
(the weather + heat model), new PRs set — persisted as a new `Insight` type
(`race_report`) with a dedicated card; (b) mark the race completed with its
result (`Race.result_time_sec`); (c) **trigger the season-plan recovery
transition** — `season_plan.py` already generates post-race recovery weeks,
but nothing re-plans the *training plan* around them: enqueue a regeneration
whose context says "raced X on Sunday in 3:42, recovery block per skeleton";
(d) push "Race report ready 🏁".
**Rationale:** The app currently coaches up to the start line (taper, pacing,
fuelling, race-week pushes) and goes silent at the finish — the emotional peak
of the entire training cycle. Runna 2026 ships post-race recovery setup;
HumanGO re-plans automatically. Every ingredient exists: race matching data,
stored pacing plans, splits, PRs, the recovery skeleton, the job queue, the
push channel.
**Effort:** M.
**Files:** `app/coach/plans.py` (`generate_race_report` + job type in
`app/coach/jobs.py`), `app/garmin_sync.py` (race-match hook post-ingest),
`app/models.py` (`Race.result_time_sec`, `completed`) + migration,
`app/season_plan.py` (recovery re-anchor), `app/routers/races.py`,
`app/schemas.py`, `frontend/src/components/activity-detail/RaceReportCard.tsx`
(new), Today surface, `tests/test_race_report.py` (new),
`tests/test_season_plan.py`.

#### C-2 · Benchmark / recalibration test workouts
**What:** A guided fitness-test flow: the athlete (or the coach, via chat
tool-use or a plan day) schedules a standardized test — 30-min solo TT
(threshold), 12-min + 3-min pair (CP/W′ anchors), or 5K time trial — as a
structured workout pushed to the watch (B-2 machinery or a seeded template).
When the completed test syncs, extract the result and run it through the
**existing threshold-estimate review flow** (`/threshold-estimate` +
apply-to-profile), presenting "your test says threshold pace 4:32/km — apply?"
with zones re-derived on apply (zone config is already threshold-anchored).
The passive CP fit continues in the background; tests add high-confidence
anchor points to the frontier with a `test` flag and stronger recency weight.
**Rationale:** HumanGO's recalibration tests are its calibration backbone;
Runna reassesses paces from performance. Our thresholds are passively fitted —
excellent when racing regularly, stale for athletes who never race tune-ups. A
test is the athlete-initiated fix, and the review/apply UI it needs was built
in v3.
**Effort:** S–M (mostly wiring: template + detection + frontier flag).
**Files:** `app/threshold.py` (test-effort anchor + weighting),
`app/strength_routines.py`-style test-template seeds (or B-2 library),
`app/garmin_sync.py` (detect completed test → enqueue estimate refresh),
`app/coach/chat.py` (optional `schedule_test` tool),
`frontend/src/components/settings/ThresholdEstimateSection.tsx` (test-result
provenance line), `tests/test_threshold.py`.

#### C-3 · Personalized heat-response model
**What:** Replace the population Ely coefficients with a per-athlete fit where
data allows: regress the athlete's own EF/GAP-pace residuals against
temperature/dew point across their weathered history (≥ ~15 warm-weather runs);
blend individual slope with the population prior (shrinkage), fall back to
population below the data threshold. Feeds everywhere `heat_pace_adjustment`
is used today: activity read-outs, conditions-aware race pacing, fuelling
fluid scaling, AI context — same interface, better number, plus a provenance
note ("based on your 22 hot runs, you cost ~7 s/km per 5 °C — above average").
**Rationale:** `CURRENT_STATE.md` flags this exact gap ("population averages
nudged by a few profile fields"). It's the kind of individualization the
AI-native competitors market but rarely ground in data; we have the stored
weather + EF pairs to actually do it.
**Effort:** M.
**Files:** `app/weather.py` (individual fit + blend, `SyncStatus`-cached by
data fingerprint like the CP fit), `app/coach/context.py` (provenance line),
`tests/test_weather.py` (synthetic athlete fixtures).

### Theme D — Motivation & analysis depth

#### D-1 · Goals, streaks & monthly recap
**What:** (a) A `Goal` model: weekly-km, monthly-km, or annual-km target plus
"runs per week" consistency; progress bars on Today (weekly) and Progress
(annual), set/edited in Settings or by the coach via a chat tool. (b)
**Streaks** derived, not stored: consecutive weeks meeting the consistency
goal, computed from data already in the weekly buckets. (c) A **monthly recap**
insight on the 1st (new scheduled enqueue, reusing the weekly-review pattern):
volume vs last month, PRs, streak status, top session — pushed, and rendered
as a card with a shareable summary (D-2).
**Rationale:** Strava/Garmin have proven goals + streaks + recaps are the
cheapest retention loop in the category; we already compute every input
(weekly buckets, PRs, load) and have the delivery channel (push + insights).
**Effort:** M.
**Files:** `app/models.py` (`Goal`) + migration, `app/routers/trends.py` or
`settings.py` (CRUD + progress), `app/coach/plans.py` (monthly recap
generator), `app/main.py` (monthly schedule), `app/coach/chat.py` (`set_goal`
tool), `app/schemas.py`, `frontend/src/components/today/GoalProgress.tsx` +
Progress annual view (new), `tests/test_goals.py` (new).

#### D-2 · Activity & recap share cards
**What:** Client-side canvas render of a share image (distance, pace, time,
map polyline trace, PBs, app-neutral styling) from Activity Detail and the
monthly recap → Web Share API (`navigator.share` with the PNG file; download
fallback). No backend, no social network — just "let me post my run."
**Rationale:** The one social feature that doesn't require a community. Every
competitor has it; athletes leave the app to make these today.
**Effort:** S–M (frontend-only).
**Files:** `frontend/src/utils/shareCard.ts` (new, canvas),
`ActivityDetailView.tsx` + recap card (share button), tests for the layout
math.

#### D-3 · Auto structure detection on unplanned activities
**What:** For runs with no matched planned workout, detect structure from the
already-aligned streams (`app/streams.py`): segment pace/HR into
steady/work/recovery blocks (changepoint detection on smoothed GAP speed),
classify the session (intervals / tempo / progression / easy / long), and
surface it — a detected-structure bar on Activity Detail (reusing
`WorkoutStructureBar`), rep splits in the laps table when Garmin laps are
absent or unpressed, and a context line for the AI ("unplanned session looked
like 6×~3:00 hard / 90 s float"). Feeds intensity distribution for runs whose
zone JSON is missing.
**Rationale:** Strava's workout analysis and TrainingPeaks both parse structure
out of raw efforts; our adherence engine can only compare against a *plan*, so
an athlete's spontaneous track session reads as an undifferentiated blob. All
inputs (aligned streams, GAP, zones) exist.
**Effort:** M–L (the segmentation heuristics need real-data tuning; ship
behind a "detected structure" label, never as ground truth).
**Files:** `app/structure_detection.py` (new), `app/routers/activities.py`
(detail response field), `app/coach/context.py`, `app/intensity.py` (fallback
input), `app/schemas.py`, `frontend/src/components/activity-detail/` (detected
bar + rep table), `tests/test_structure_detection.py` (stream fixtures).

#### D-4 · Training status label + familiar fitness number
**What:** (a) Derive a **training-status label** from signals we already
compute — CTL slope × EF/decoupling trend × TSB: *productive / maintaining /
overreaching / detraining / peaking / recovery* — shown on the Today hero
ring's accordion and Progress, with the one-line "because" (CTL +4/wk, EF
improving). (b) Publish a **VDOT/VO2max-style number** derived from the
existing CV/D′ race predictions (Daniels mapping) so athletes get the familiar
cross-app currency; show it beside the performance curve with its confidence.
**Rationale:** Garmin's vocabulary is the lingua franca; we compute strictly
more than it does but never say the word an athlete recognizes. Zero new
data — presentation + one mapping function.
**Effort:** S.
**Files:** `app/training_load.py` (status derivation), `app/threshold.py`
(VDOT mapping), `app/routers/{daily,trends}.py`, `app/schemas.py`,
`frontend/src/components/today/TodayHero.tsx`, Progress,
`tests/test_training_load.py`, `tests/test_threshold.py`.

#### D-5 · Gear / shoe tracking
**What:** A `Gear` model (name, type, start date, retired flag, alert-km),
per-activity assignment (default shoe auto-assigns on ingest; editable on
detail), cumulative mileage on a Settings/Progress panel, and a push when a
shoe crosses its alert threshold (~700 km default). Include gear in the AI
context only when a niggle is active (worn shoes + recurring shin note is a
classic pattern the coach should see).
**Rationale:** Garmin/Strava/TP staple; injury-relevant, not just bookkeeping.
Cheap and self-contained.
**Effort:** S–M.
**Files:** `app/models.py` (`Gear`, `Activity.gear_id`) + migration, new
router or `settings.py` (CRUD + assign), ingest default-assign hook,
`app/coach/context.py` (conditional line), `app/schemas.py`,
`frontend/src/components/settings/GearSection.tsx` (new), detail assignment,
`tests/test_gear.py` (new).

#### D-6 · Matched routes (repeated-run progress) — stretch
**What:** Fingerprint each activity's route (start/end proximity + downsampled
polyline hash over stored lat/lon streams); group repeats; on Activity Detail
show "you've run this route 14 times — 2nd fastest, 0:41 off your best" with a
small trend spark; a Routes list under Progress. Requires GPS streams only —
no external services.
**Rationale:** Strava's matched runs is one of its stickiest analysis
features and a natural fit for a data-rich single-athlete app; but it's
non-trivial geometry with real edge cases (out-and-backs, GPS drift), hence
stretch-tier.
**Effort:** L.
**Files:** `app/routes.py` (new — fingerprint + match), migration
(`Activity.route_id` or a `Route` table), backfill job, `app/routers/trends.py`,
frontend Routes view + detail strip, `tests/test_routes.py`.

### Theme E — Platform & engineering hygiene

- **E-1 · Fixture-driven Playwright smoke in CI. (S–M)** The redesign review's
  visual playbook (fixture-intercepted `/api/v1/*`, 390×844 + 1280×800
  screenshots of Today/Plan/Activities/Detail/Progress) has now caught **every
  bug the unit suites structurally cannot see** (flex/order no-ops, sticky
  containing-block traps — see `tasks/lessons.md`, three separate entries) yet
  still runs by hand. Commit the fixture set
  (`frontend/e2e/fixtures.ts`, generated from `api/types.ts`), a Playwright
  config using the pre-installed Chromium, ~6 smoke specs asserting layout
  invariants (section order at 390 px, sticky header visibility, no
  white-screen on malformed payloads), and a `frontend-e2e` job in `tests.yml`.
- **E-2 · SQLite backup & restore story. (S)** A nightly scheduled job that
  runs `VACUUM INTO` (or the backup API) to `/data/backups/` with N-day
  retention, a `GET /export/archive` pointer in Settings, and a documented
  restore path in the README. The entire product state — including irreplaceable
  chat/memory/insight history — currently lives in one un-backed-up file on one
  volume; Watchtower auto-updates make a bad-migration scenario real.
- **E-3 · `pywebpush`/`http-ece` build fragility. (S)** Fresh containers can't
  build `http-ece` (documented in `lessons.md`; it forced a stub during two
  review cycles and leaves `test_notifications.py` red in CI-like envs). Fix
  properly: pin known-good wheels, or make the import lazy inside
  `app/notifications.py` (`notify()` already no-ops without VAPID keys) so the
  app and full test suite work without the package, with a skip-marker on the
  webpush tests when absent.
- **E-4 · Import/source abstraction note.** A-1's `Activity.source` column and
  post-ingest hook is deliberately the thin end of a source-adapter seam
  (Strava/COROS/Polar APIs later, if ever). Don't build the abstraction now —
  just keep `importers.py` free of Garmin-isms so a second adapter has a home.
- **E-5 · Architecture: no change recommended.** FastAPI + SQLite (WAL) +
  APScheduler + the `AIJob` table-queue remain right-sized (re-affirming v5's
  assessment post-P3-2 thread pool). Nothing in this plan needs Postgres,
  Redis, or an external queue; A-1's file parsing runs in the existing job
  worker. Revisit only if real multi-tenant use materializes (then: per-user
  sync fan-out concurrency first, DB second).

---

## 5. Suggested sequencing

Each phase is independently shippable; later phases compound on earlier ones.

- **Phase 1 — Own your data:** A-3 (manual races — smallest, unblocks season
  planning for non-Garmin-calendar users) → A-2 (export) → A-1 (import +
  manual entry; the biggest single item, do it while the theme's context is
  hot). E-2 and E-3 ride along (data-safety theme, tiny).
- **Phase 2 — Steer the plan:** B-1 (move/skip/swap) → B-3 (structured steps +
  planned overlay) → B-2 (workout builder, which then benefits from B-3's step
  rendering everywhere).
- **Phase 3 — Race & fitness lifecycle:** C-1 (post-race report/recovery) →
  C-2 (benchmark tests) → C-3 (personal heat model, informs next summer's
  races).
- **Phase 4 — Motivation & depth:** D-4 (status label — cheapest win first) →
  D-1 (goals/streaks/recap) → D-2 (share cards) → D-5 (gear) → D-3 (structure
  detection) → D-6 (matched routes, stretch).
- **Throughout:** A-4 (units) whenever a formatting surface is already being
  touched, at the latest before Phase 4's new surfaces multiply the sweep;
  E-1 (Playwright CI) alongside the first frontend-heavy phase.

**Verification per phase** (per `CLAUDE.md` and the established playbook):
`pytest` green, `cd frontend && npm run build && npm test` green, plus the
fixture-driven visual smoke (E-1 makes this CI-automatic) for any phase that
touches layout. Backend items ship with additive schemas and migration +
data-isolation tests (every new table carries `user_id`, mirroring
`tests/test_data_isolation.py`).

---

## 6. Sources

- Garmin — [Active Intelligence / Connect+](https://support.garmin.com/en-US/?faq=kWi5DoaMPZ4VCJBA0lFWP7), [Connect Performance Dashboard](https://www.garmin.com/en-US/blog/fitness/what-is-the-garmin-connect-performance-dashboard/)
- Strava — [Athlete Intelligence](https://support.strava.com/hc/en-us/articles/26786795557005-Athlete-Intelligence-on-Strava), [Athlete Intelligence announcement](https://press.strava.com/articles/stravas-athlete-intelligence-translates-workout-data-into-simple-and), [Subscriber feature updates (routes, analysis)](https://press.strava.com/articles/strava-enhances-subscriber-experience-with-updates-to-key-features), [Subscription features](https://support.strava.com/en-us/articles/15402044-strava-subscription-features)
- Runna — [2026 app updates: adaptive plans, plan continuity, post-race recovery, weather adjustments](https://www.runningwestwardho.co.uk/post/runna-app-updates-2026-smarter-training-plans-adaptive-coaching-new-features-explained), [Runna review 2026](https://runwithrachel.co.uk/runna-app-review/)
- HumanGO — [humango.ai](https://humango.ai/), [How it works (athletes)](https://humango.ai/how-it-works/athletes), [Recalibration tests & adaptive rescheduling (comparison)](https://www.gneta.app/compare/humango)
- TrainingPeaks — [Premium (workout builder, library, PMC)](https://www.trainingpeaks.com/premium/), [Athlete features](https://www.trainingpeaks.com/athlete-features/), [HRV tracking guide](https://www.trainingpeaks.com/blog/how-to-track-your-heart-rate-variability-using-trainingpeaks/)
- Prior internal benchmarks — [`IMPROVEMENT_PLAN.md`](./IMPROVEMENT_PLAN.md) §5 (Stryd, Intervals.icu, Coach Leo sources), [`UI_UX_REDESIGN_PLAN.md`](./UI_UX_REDESIGN_PLAN.md) §3 (Garmin/Strava/Runna/Oura/WHOOP design benchmark)
