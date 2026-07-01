# Running Coach — Improvement Plan (v4)

_Last updated: 2026-06-30_

The v3 plan (2026-06-25) has been **fully delivered**. Benchmarked against
[`CURRENT_STATE.md`](./CURRENT_STATE.md), every v3 item now ships: the
**conversational AI coach** (SSE chat), **aerobic decoupling / efficiency factor**
(surfaced as the aerobic-efficiency trend that replaced the originally-specced
durability score), **race-day pacing strategy**, **structured-output plan
generation**, the **durable AI task queue**, the **strength/mobility routine
library**, **incremental load/threshold compute**, the **startup security guard**,
the **config-driven model catalog**, the **Garmin schema-drift canary**, and
**infinite-scroll history**.

So the app now computes the higher-order metrics, surfaces them, *and* talks. This
v4 plan benchmarks the app **as it exists today** against a refreshed mid-2026
competitive set and targets the frontier that conversational + analytical parity
has exposed: **context the coach doesn't yet use (weather/terrain/life), a coach
that talks but can't yet act, and daily adaptation.**

It is a **plan only** — no code has been changed.

---

## 1. Comparison set & central finding

| App | Paradigm | What it does that we don't (yet) |
|---|---|---|
| **Runna** | Adaptive prescriptive plans | **Weather-aware sessions** (heat/humidity pace adjustment), in-run **audio guidance** with **fuelling/hydration reminders**, **post-race recovery** setup, a holistic strength/nutrition coaching hub |
| **Stryd** | Power-based execution | **Course/terrain-aware race power & splits** (Event Planner over a GPX course profile), explicit **Running Stress Balance** overtraining/undertraining zones |
| **Garmin Coach / DSW** | Readiness-driven daily adaptation | **Daily Suggested Workouts** that down/up-regulate *today's* prescription from Training Readiness; **Endurance Score** + **Hill Score** (terrain-specific ability) |
| **TrainingPeaks** | Analytical + structured | **Annual Training Plan** (season-long periodization to an A-race) with weekly TSS targets; progressive **strength builder** with demo videos |
| **Coach Leo / HumanGO ("Hugo") / Trenara** | AI-native conversational | A coach with **persistent memory** (how you felt, what hurt, life context) that **acts on the conversation** — "I'm travelling next week, rework it" actually reworks the plan; daily feel-based adaptation |
| **MeteoPace / RunWeather** | Conditions modelling | Single **conditions score** + concrete pace adjustment (sec/km) from temperature, dew point, wind, and course gradient |

**Central finding (v4):** parity on *computing* and *conversing* is done. The
remaining gaps cluster into three themes, and — as in prior cycles — most
high-leverage items **reuse data and infrastructure already in the codebase**:

1. **The coach ignores context it already has (or could cheaply get).** We store
   `Activity.weather_json` on every run but **never use it** — not in analysis, not
   in readiness, not in pacing (`grep` confirms weather is touched only in sync /
   API / schema layers). Heat and dew point are the single biggest day-to-day
   confounder of pace, and Runna/MeteoPace/RunWeather have made weather-adjusted
   pace table stakes. Likewise we compute **GAP** but pace races on **flat even/
   negative splits** (`app/pacing.py` has no elevation term) while Stryd/Garmin pace
   the actual course.
2. **The coach can talk but can't act.** `chat_stream` reuses `_build_context` and
   streams beautifully, but it's **read-only** — tool-use is wired for plan
   generation (`_PLAN_TOOL_SCHEMA`) yet not exposed to chat. So "rework next week,
   I'm travelling" produces *advice*, not a *changed plan*. And every chat starts
   cold: there's no **persistent athlete memory** (injuries, preferences, life
   events, how efforts felt) that Coach Leo/Hugo treat as the whole point.
3. **The plan is weekly and static; the day isn't adapted.** We compute a 0–100
   **readiness** score every morning but the prescribed `TrainingPlanDay` never
   moves — Garmin DSW's core loop (swap today's hard session for easy when you're
   shot, nudge up when you're primed) is absent. Plus there's no
   **fuelling/hydration** guidance and no **post-race recovery** automation around
   the races we already track.

---

## 2. Gap matrix (today)

Legend: ✓ full · ◑ partial · ✗ absent

| Capability | Running Coach (today) | Runna | TrainingPeaks | Garmin | Stryd | Coach Leo/Hugo |
|---|---|---|---|---|---|---|
| Conversational coach (chat) | ✓ (SSE, multi-turn) | ◑ | ✗ | ✗ | ✗ | ✓ |
| Coach **acts on** the conversation (adapts plan) | ✗ (read-only) | ◑ | ✗ | ✗ | ✗ | ✓ |
| Persistent athlete memory (feel / life context) | ✗ | ◑ | ✗ | ✗ | ✗ | ✓ |
| Weather-adjusted pace / analysis | ✗ (weather stored, unused) | ✓ | ◑ | ◑ | ◑ | ◑ |
| Terrain / GAP-aware race pacing | ✗ (flat splits only) | ◑ | ◑ | ✓ (PacePro) | ✓ | ✗ |
| Daily readiness-driven workout adaptation | ✗ (readiness computed, plan static) | ◑ | ✗ | ✓ (DSW) | ◑ | ✓ |
| Fuelling / hydration guidance | ✗ | ✓ | ✗ | ◑ | ✗ | ◑ |
| Post-race recovery automation | ✗ | ✓ | ◑ | ◑ | ✗ | ◑ |
| Race-day pacing strategy (splits) | ✓ (even / negative) | ✓ | ◑ | ✓ | ✓ | ◑ |
| Aerobic decoupling / efficiency trend | ✓ | ◑ | ✓ | ◑ | ✓ | ✗ |
| Closed-loop / adaptive plan | ✓ | ✓ | ◑ | ✓ | ◑ | ✓ |
| Push structured workout to device | ✓ | ✓ | ✓ | ✓ | ◑ | ✗ |
| Performance/power curve + race predictions | ✓ | ◑ | ◑ | ✓ | ✓ | ✗ |
| Season-long / annual periodization | ◑ (rolling 4-week) | ◑ | ✓ (ATP) | ◑ | ◑ | ◑ |
| Running Stress Balance / explicit over-under zones | ◑ (TSB+ACWR) | ◑ | ✓ | ✓ | ✓ | ◑ |
| User-defined custom charts | ✗ | ✗ | ◑ | ✗ | ✗ | ✗ |

---

## 3. Prioritized improvements

Ordered by **impact ÷ effort**, favoring reuse of data and infrastructure already
present. Effort key: **S** ≈ <1 day · **M** ≈ 1–3 days · **L** ≈ several days.

### P0 — Highest leverage, data/infra already present

#### P0-1 · Weather-adjusted pace & heat-aware coaching ✅ DONE (2026-06-30)
**What:** Use the `Activity.weather_json` we already store. Add a small helper that
derives a **heat/dew-point pace adjustment** (sec/km) and an effort-normalized
"weather-adjusted pace" per run, then (a) show it on Activity Detail next to raw
pace, (b) fold a one-line "23°C / dew point 18°C — ~12 s/km heat penalty, effort
was stronger than the clock" into the AI activity context, and (c) factor recent
heat stress into the readiness/recovery narrative. Optionally surface a "today's
conditions" note on Today from the latest daily/weather data.
**Rationale:** The clearest "context we own but ignore" gap — weather is stored on
every activity and used **nowhere** analytically (confirmed by grep). Heat/dew point
is the biggest day-to-day pace confounder, and Runna, MeteoPace, and RunWeather have
made weather-adjusted pace an expectation. Pure analytic add over stored data; no
new sync.
**Effort:** S–M.
**Files:** `app/weather.py` (new), `app/ai_coach.py` (`_format_activity_context`,
`_recent_heat_stress_note`, `_build_context`), `app/api.py` (activity detail),
`app/schemas.py`, `frontend/src/api/types.ts`,
`frontend/src/components/activity-detail/ActivityDetailView.tsx` + `.css`,
`tests/test_weather.py` (new, 19 tests).

#### P0-2 · Let the coach act on the conversation (chat tool-use) ✅ DONE (2026-06-30)
**What:** Give `chat_stream` the same tool-use treatment plan generation already
has. Define a small set of coach tools — `regenerate_plan`,
`adjust_upcoming_week(reason)`, `mark_setback(tag, note)`, `explain_workout(date)`
— and let the model call them mid-conversation. Tool calls **enqueue `AIJob`s**
(the durable queue already exists) rather than mutating inline, and the chat streams
back a confirmation ("Reworked next week around your travel — easy runs Tue/Thu, long
run moved to Sunday"). Keep plain Q&A as the default path.
**Rationale:** Today the coach talks but is **read-only** — `_PLAN_TOOL_SCHEMA` is
wired for plan generation but not exposed to chat, so "I'm travelling next week,
rework it" yields advice, not a changed plan. This is the 2026 differentiator that
Coach Leo / HumanGO ("Hugo") / Trenara are built on, and we already own every hard
part: provider dispatch with tool-use, the context builder, the realignment /
generation entry points, and the `AIJob` ledger to run them durably.
**Effort:** M.
**Files:** `app/ai_coach.py` (`_CHAT_TOOL_SCHEMAS`/`_CHAT_GEMINI_TOOLS`,
`_dispatch_chat_tool`, streaming tool-use loop in `_stream_claude`/`_stream_gemini`,
optional `note` threaded through `generate_training_plan`/`execute_job`, reusing
`enqueue_job`), `app/models.py` (`ChatMessage.actions_json`), `alembic/versions/`
(migration), `app/api.py` (`POST /chat` relays `action` SSE events, `GET /chat`
round-trips them), `app/schemas.py` (`ChatAction`), `frontend/src/api/types.ts`,
`frontend/src/components/chat/ChatView.tsx` + `.css` (action chips),
`tests/test_ai_coach.py`, `tests/test_job_queue.py`, `tests/test_api_endpoints.py`
(17 new tests).

### P1 — Execution depth & daily adaptation

#### P1-1 · Daily readiness-driven workout adaptation ✅ DONE (2026-07-01)
**What:** Close the loop between the **readiness score we already compute** and the
**static plan day**. On Today load, if the selected day's prescribed `TrainingPlanDay`
is hard (tempo/interval/long) and readiness is low, propose a down-regulated swap
(Low readiness → rest, Fair readiness → easy at ~60% distance); if readiness is
Excellent on an easy day, offer a small upgrade nudge (+15% distance, capped at
+2 km). Surfaced as an accept/dismiss card on Today; accepting mutates the
`TrainingPlanDay` in place (so adherence/plan context automatically reflects the
swap), dismissing snoozes it via the existing `SyncStatus` key/value store. Purely
rule-based (readiness bands × workout type) — no AI involved.
**Rationale:** Garmin DSW's core loop. We have the inputs (readiness, the plan, the
calendar) but never act on them day-to-day — the plan is regenerated weekly and
otherwise frozen. High-signal, mostly deterministic, and it makes readiness
*actionable* instead of merely displayed.
**Effort:** M.
**Files:** `app/plan_adaptation.py` (new, `suggest_adaptation`), `app/schemas.py`
(`PlanAdaptationSuggestion`, `PlanAdaptationRequest`, `TodayResponse.plan_adaptation`),
`app/api.py` (`GET /today` attaches the suggestion; new
`POST /training-plan/adapt-day` accept/dismiss endpoint, reusing `SyncStatus` — no
migration needed), `frontend/src/api/types.ts`, `frontend/src/api/hooks.ts`
(`useAdaptPlanDay`), `frontend/src/components/today/PlanAdaptationCard.tsx` + `.css`,
`TodayView.tsx`, `tests/test_plan_adaptation.py` (new, 11 tests),
`tests/test_api_endpoints.py` (9 new tests).

#### P1-2 · Terrain / GAP-aware race pacing (+ optional course import)
**What:** Extend `app/pacing.py` beyond flat even/negative splits to allocate pace by
**gradient** using the GAP model already in `app/streams.py`: given a course
elevation profile, hold *effort* (GAP-pace / power band) constant so uphill splits are
slower and downhills faster while hitting the target time. Source the profile from an
uploaded **GPX** (new lightweight parser) or from a matched prior activity's elevation
stream. Render the elevation-aware split table and keep the existing push-to-watch
path.
**Rationale:** We compute GAP everywhere but pace races as if every course were flat —
Stryd's Event Planner and Garmin PacePro pace the *actual course*. The natural
"execute the real race" upgrade to the pacing feature shipped in v3; reuses GAP,
race prediction, and the workout translator.
**Effort:** M (L if GPX upload + course matching UI).
**Files:** `app/pacing.py` (gradient-aware allocation), `app/streams.py` (reuse GAP /
elevation), optional `app/garmin_sync.py` or new parser for GPX, `app/api.py`
(`/races/{id}/pacing` params + course upload), `frontend/src/components/plan/` or
`today/` pacing card + types.

#### P1-3 · Persistent athlete memory for the coach ✅ DONE (2026-07-01)
**What:** A durable, user-scoped **coach memory** the AI reads on every analysis and
chat turn: structured facts the athlete (or the coach, via P0-2 tool-use) records —
current niggles, life constraints ("marathon training around shift work"),
preferences ("hates treadmills"), and salient how-it-felt notes distilled from chat /
feedback. Inject a compact "what the coach remembers" block into `_build_context` and
`_build_chat_context`.
**Rationale:** Coach Leo / Hugo's headline is *memory* — "remembers what hurt, what
worked, how you felt." We persist chat turns but never distill them into durable
context, so every session re-derives the athlete from metrics alone. Turns the
conversational coach from stateless Q&A into a relationship.
**Effort:** M.
**Files:** `app/models.py` (`CoachMemory`: category/tag/note/active) + Alembic
(`l5m6n7o8p9q0_add_coach_memory`), `app/ai_coach.py`
(`_format_coach_memory_context` injected into `_build_context`, which
`_build_chat_context` already delegates to; the `mark_setback` chat tool now also
writes a durable `CoachMemory` row alongside its existing `Insight`), `app/api.py`
(`GET/POST /coach-memory`, `PUT/DELETE /coach-memory/{id}`), `app/schemas.py`
(`CoachMemoryRequest`/`CoachMemoryUpdateRequest`/`CoachMemoryResponse`),
`frontend/src/components/settings/CoachMemorySection.tsx` + `.css`,
`frontend/src/api/types.ts`, `frontend/src/api/hooks.ts`,
`tests/test_coach_memory.py` (new, 9 tests), `tests/test_ai_coach.py` (5 new/updated
tests).

### P2 — Breadth & coaching completeness

#### P2-1 · Fuelling & hydration guidance
**What:** Generate simple, personalized **fuelling/hydration** guidance for long runs
and races — carb-per-hour and fluid targets scaled by duration, intensity, body weight
(in `AthleteProfile`), and recent **heat** (reuses P0-1) — rendered on the long-run /
race workout detail, and optionally as in-plan reminders.
**Rationale:** Runna's 2026 push (hydration/nutrition checklists, fuelling audio
reminders) and a recurring holistic-coaching differentiator; we cover strength now but
not fuel. Builds on profile + weather data already present.
**Effort:** M.
**Files:** new `app/nutrition.py` (targets model), `app/ai_coach.py` (plan/long-run
context), `app/api.py`, `frontend/src/components/workout-detail/*` + `plan/*` + types.

#### P2-2 · Post-race recovery & race-aware taper automation
**What:** Use the `Race` / Garmin race calendar we already track to auto-shape the
plan around key races: a **taper** ramp into an A-race and a structured **recovery
block** after it (reduced volume, easy/cross days), folded into plan generation and
realignment rather than left to the athlete.
**Rationale:** Runna is adding post-race recovery setup; tapering/recovery is core
periodization we don't automate despite knowing every race date and priority. Sharpens
the closed-loop plan around the moments that matter most.
**Effort:** M.
**Files:** `app/ai_coach.py` (plan prompt/schema + realignment around race dates),
possibly `app/training_load.py` (recovery-load shaping), `frontend/src/components/plan/*`.

#### P2-3 · Explicit Running Stress Balance guidance ✅ DONE (2026-07-01)
**What:** Promote the TSB/ACWR we already compute into an explicit
**over-/under-training "sweet-spot" read** — a labelled zone (detraining / productive /
overreaching) with a plain-language recommendation, on Today and in the AI context,
rather than a raw Form number.
**Rationale:** Stryd's Running Stress Balance and TrainingPeaks' performance-management
guidance make this an at-a-glance decision aid; we have the inputs but present them as
numbers. Cheap interpretation layer over existing series.
**Effort:** S–M.
**Files:** `app/schemas.py` (`classify_tsb`/`classify_acwr`, `TrainingLoadPoint`
zone/label/recommendation fields, auto-derived via a model validator),
`app/training_load.py` (`_interpret_tsb`/`_interpret_acwr` now reuse the same
classifiers; `format_training_load_context` renders the RSB recommendation),
`frontend/src/components/today/TrainingLoadChart.tsx` + `.css` (server-derived zone
badges replace the old client-side duplicate banding, plus a recommendation line),
`frontend/src/api/types.ts`, `tests/test_training_load.py`,
`tests/test_training_load_edge.py` (10 new tests).

### P3 — Hygiene, scale & carryover (largely independent)

- **P3-1 · Season-long / annual periodization.** Today's plan is a rolling 4-week
  window; TrainingPeaks' ATP periodizes a whole season to an A-race with weekly TSS
  targets. Add a longer-horizon plan skeleton (phase blocks to the goal race) that the
  4-week generator fills in. **L.** Files: `app/ai_coach.py`, `app/models.py` + Alembic,
  `frontend/src/components/plan/*`.
- **P3-2 · Strength progression & demos.** The routine library is static; Garmin/
  TrainingPeaks are adding progressive load and demo videos. Add per-week progression
  and optional exercise demo links. **S–M.** Files: `app/strength_routines.py`,
  `frontend/src/components/workout-detail/*`.
- **P3-3 · User-defined custom charts.** Carryover from v3 — an Intervals.icu-style
  custom chart/metric builder over the stored series. **L.** Files: `app/api.py`,
  `frontend/src/components/trends/*` + hooks/types.
- **P3-4 · Security default hardening.** The startup guard *warns* on an
  unauthenticated non-loopback bind but still starts; consider **refusing** to start in
  that configuration (opt-out env for trusted private networks). **S.** Files:
  `app/main.py`, `app/config.py`, docs.
- **P3-5 · Keep the suite green.** New surfaces (chat tool-use, weather, daily
  adaptation, GPX) need contract/edge tests; preserve the 80% coverage gate (~551
  backend tests today). **Throughout.** Files: `tests/`.

---

## 4. Suggested sequencing

- **Phase A — use the context we already own:** P0-1 (weather-adjusted pace) + P2-3
  (RSB guidance). Both are cheap interpretation layers over stored data and make the
  coach visibly smarter immediately; P0-1 also feeds P2-1.
- **Phase B — make the conversational coach act:** P0-2 (chat tool-use) → P1-3
  (persistent memory). P0-2 turns chat from advice into action; P1-3 gives it
  continuity. Together they are the 2026 conversational frontier and reuse the AIJob
  queue and context builder.
- **Phase C — daily adaptation & real-course execution:** P1-1 (readiness-driven daily
  adaptation) → P1-2 (terrain-aware pacing) → P2-2 (race-aware taper/recovery). This is
  the "adapt the day, pace the real race" loop.
- **Phase D — breadth:** P2-1 (fuelling/hydration), then P3 items as capacity allows.
- **Throughout:** P3-5 tests in parallel; land **P3-4 (security hardening)** whenever
  touched — it's the only item with real downside risk.

---

## 5. Sources

- Runna — [2026 app updates: smarter/adaptive plans, weather adjustments, strength, fuelling](https://www.runningwestwardho.co.uk/post/runna-app-updates-2026-smarter-training-plans-adaptive-coaching-new-features-explained), [Training plans](https://www.runna.com/training/training-plans), [Garmin integration](https://www.runna.com/integrations/garmin)
- Stryd — [Race Power Calculator](https://help.stryd.com/en/articles/6879547-race-power-calculator), [Race Calculations FAQ](https://help.stryd.com/en/articles/8955821-stryd-race-calculations-faq), [Features (Running Stress Balance, Power Duration Curve)](https://www.stryd.com/features)
- Garmin — [Training Readiness (six factors)](https://the5krunner.com/garmin-features/training/training-readiness/), [Garmin Coach expands to adaptive running/cycling/strength](https://garminrumors.com/garmin-expands-garmin-coach-with-adaptive-running-cycling-and-strength-training-plans/), [Daily Suggested Workouts & training features](https://the5krunner.com/garmin-features/training/), [Advanced strength feature](https://the5krunner.com/2026/04/02/garmin-strength-training-features-survey/)
- TrainingPeaks — [Creating a training plan (2026)](https://www.trainingpeaks.com/coach-blog/how-to-create-a-trainingpeaks-training-plan/), [Annual Training Plan methodologies](https://help.trainingpeaks.com/hc/en-us/articles/224662768-Annual-Training-Plan-Methodologies), [Workout Builder & Strength Builder](https://www.trainingpeaks.com/learn/articles/introducing-trainingpeaks-workout-builder/)
- AI-native coaches — [Coach Leo (conversational, persistent memory)](https://coachleo.ai/best-ai-running-coach), [HumanGO / "Hugo"](https://humango.ai/), [Best AI running coach apps 2026 comparison](https://therunninggenie.com/blog/best-ai-running-coach-apps)
- Conditions modelling — [MeteoPace (weather + course-profile pace)](https://www.meteopace.com/), [RunWeather (conditions score + pace adjustment)](https://runweather.app/), [Heat/humidity pace research](https://apps.runningwritings.com/heat-adjusted-pace/)
- Tooling — [python-garminconnect](https://github.com/cyberjunky/python-garminconnect)
