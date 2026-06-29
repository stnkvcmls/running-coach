# Running Coach — Improvement Plan (v3)

_Last updated: 2026-06-25_

The v2 plan (2026-06-19) has been **fully delivered**. Benchmarked against
[`CURRENT_STATE.md`](./CURRENT_STATE.md), every v2 P0–P2 item now ships: ACWR +
ramp-rate injury flags, the Critical-Power/CV **performance curve with race
predictions**, **closed-loop** (adherence-aware) plan generation, **plan
realignment**, **HRV** sync into readiness, **time-in-zone / intensity
distribution**, **per-interval adherence**, strength/cross in plans, and the
flagship **push structured workouts to the Garmin device**
(`app/workout_translator.py`). The v2 hygiene items also landed: Alembic
migrations, the model catalog moved to `app/config.py`, and full **Cloudflare
Access multi-user auth + per-user data isolation**.

In other words, last cycle closed both the *derivation* gap (we compute the
higher-order metrics) **and** the *surfacing* gap (they're now in the UI and AI
context). This v3 plan benchmarks the app **as it exists today** against the same
competitive set, refreshed for mid-2026, and targets the frontier that parity
has now exposed.

It is a **plan only** — no code has been changed.

---

## 1. Comparison set & central finding

| App | Paradigm | What it does that we don't (yet) |
|---|---|---|
| **Runna** | Adaptive prescriptive plans | In-run **audio guidance** + **race-day pacing strategy** (controlled-start / negative-split pacing tuned to fitness & distance); holistic strength/mobility/nutrition content |
| **TrainingPeaks** | Analytical + structured workouts | **Efficiency Factor / aerobic decoupling (Pw:Hr)** as a first-class post-workout metric; deep compliance reporting |
| **Garmin Coach / DSW** | Readiness-driven daily adaptation | **Endurance Score** + **Hill Score** (fatigue-resistance / terrain-specific ability); PacePro split-by-split race pacing |
| **Stryd** | Power-based | **Race Power Calculator & Event Planner** (target power/splits for a specific course); durability/fatigue monitoring |
| **HumanGO / TrainAsONE / Coach Leo** | AI-native coaching | **Conversational coach** ("Hugo"/"Leo") you can *ask why*, *negotiate*, and feed life-context to — the 2026 differentiator vs. black-box plans |
| **Intervals.icu** | Open analytics | User-defined **custom charts/metrics**; aerobic decoupling, W' balance, efficiency over a season |

**Central finding (v3):** the remaining gaps are no longer about computing or
displaying metrics — they're about **interaction, execution, and trust**:

1. **The coach can't hold a conversation.** Every AI touchpoint
   (`analyze_activity`, `weekly_review`, plan generation) is **one-shot and
   broadcast** — the model emits an insight; the athlete can rate it but cannot
   ask "why this workout?", "I'm travelling next week, rework it", or "is this
   niggle a problem?". The 2026 market (HumanGO's Hugo, Coach Leo, ChatGPT-with-
   data) is converging on a *conversational* coach. We are uniquely positioned:
   the multi-provider dispatch (`_call_ai`) and the rich `_build_context` are
   already built — a chat surface is mostly plumbing on top of assets we own.
2. **We prescribe the race but don't pace it.** We push the workout to the watch
   and predict race times, but there's no **race-day pacing strategy** — the
   split-by-split, elevation-aware plan that Stryd's Race Power Calculator and
   Garmin PacePro deliver. The CP/CV model and race predictions already exist
   (`get_performance_curve_data`); this is the natural "execute" half of the loop.
3. **We don't yet measure fatigue resistance.** Garmin Endurance Score, Stryd
   durability, and TrainingPeaks' decoupling all answer "can you *hold* it?" — we
   compute mean-maximal curves but never the **aerobic decoupling** or
   **durability** that fall straight out of the stream data we already store.
4. **Reliability is now the limiting factor on trust.** On-demand AI runs inline
   or on short-lived threads (no durable queue), plan generation depends on the
   model emitting parseable JSON under a 4096-token cap, and a publicly exposed
   instance with `auth_enabled=False` leaks all data. These are called out in
   `CURRENT_STATE.md` §"Notable Gaps" and now gate everything above.

As before, most high-leverage items **reuse data and infrastructure already in
the codebase**.

---

## 2. Gap matrix (today)

Legend: ✓ full · ◑ partial · ✗ absent

| Capability | Running Coach (today) | Runna | TrainingPeaks | Garmin | Stryd | Intervals.icu |
|---|---|---|---|---|---|---|
| Conversational / interactive coach | ✗ (one-shot insights + feedback) | ◑ | ✗ | ✗ | ✗ | ✗ |
| Race-day pacing strategy (splits) | ✗ (predicts time only) | ✓ | ◑ | ✓ (PacePro) | ✓ | ✗ |
| Aerobic decoupling / efficiency factor | ✗ | ◑ | ✓ | ◑ | ✓ | ✓ |
| Durability / endurance (fatigue-resistance) | ✗ | ✗ | ◑ | ✓ | ✓ | ◑ |
| Hill / terrain-specific ability | ✗ (GAP computed, not profiled) | ✗ | ✗ | ✓ | ◑ | ◑ |
| Closed-loop / adaptive plan | ✓ | ✓ | ◑ | ✓ | ◑ | ◑ |
| Push structured workout to device | ✓ | ✓ | ✓ | ✓ | ◑ | ◑ |
| Performance/power curve + race predictions | ✓ | ◑ | ◑ | ✓ | ✓ | ✓ |
| ACWR / ramp-rate / injury flag | ✓ | ◑ | ✓ | ✓ | ✗ | ◑ |
| HRV in readiness | ✓ | ◑ | ✗ | ✓ | ✗ | ✓ |
| Durable AI task execution (no inline blocking) | ✗ (inline / daemon thread) | n/a | n/a | n/a | n/a | n/a |
| User-defined custom charts | ✗ | ✗ | ◑ | ✗ | ✗ | ✓ |

---

## 3. Prioritized improvements

Ordered by **impact ÷ effort**, favoring reuse of data and infrastructure
already present. Effort key: **S** ≈ <1 day · **M** ≈ 1–3 days · **L** ≈ several
days.

### P0 — Highest leverage, infrastructure already present

#### ✅ P0-1 · Conversational AI coach (chat)
**What:** A chat surface where the athlete converses with the coach in context.
Reuse `_build_context` to seed a system/context block, then run a **multi-turn**
exchange through the existing provider dispatch — add a `chat()` entry point
alongside `_call_claude`/`_call_gemini` that accepts a message history instead of
a single prompt. Persist turns (new `ChatMessage` model, or reuse `Insight` with a
`conversation` category) scoped by `user_id`. Optionally let the model reference a
specific activity/plan day so "why this workout?" pulls that row's context.
Surface as a new bottom-nav tab or a launcher on Today.
**Rationale:** The clearest 2026 differentiator — HumanGO ("Hugo"), Coach Leo, and
ChatGPT-with-data all converge here, and TrainAsONE/Runna are explicitly
criticized as black boxes. We already own the two hard parts (a rich per-user
context builder and multi-provider dispatch with retry/backoff); this is mostly
state + a streaming endpoint + UI.
**Effort:** M–L (L if streamed token-by-token via SSE).
**Files:** `app/ai_coach.py` (new `chat()` / history-aware variant of `_call_ai`,
reuse `_build_context`), `app/api.py` (`POST /chat`, history fetch; SSE optional),
`app/models.py` + Alembic revision (`ChatMessage`), `app/schemas.py`, new
`frontend/src/components/chat/*`, `frontend/src/api/` hooks + types, bottom-nav
entry in `frontend/src/components/layout/*`.

#### ✅ P0-2 · Aerobic decoupling / efficiency factor
**What:** From the aligned power/GAP-speed/HR stream arrays already parsed in
`app/streams.py`, compute **aerobic decoupling** (first-half vs second-half
power-or-pace : HR ratio) and **efficiency factor** (NP/avg-HR or GAP-speed/avg-
HR) per activity. Store on `Activity` (one or two float columns), show on Activity
Detail, and fold a one-line "decoupling 4.2% — strong aerobic durability" into the
AI context.
**Rationale:** A TrainingPeaks/Intervals.icu/Stryd staple and one of the cheapest
high-signal aerobic-fitness reads available. Everything needed (aligned streams,
GAP, threshold) already exists — this is a pure analytic add over stored data.
**Effort:** S.
**Files:** `app/streams.py` (decoupling/EF helper over existing arrays),
`app/models.py` + Alembic (`Activity.decoupling_pct`, `Activity.efficiency_factor`),
`app/api.py` (include in activity detail), `app/ai_coach.py`
(`_format_activity_context`), `frontend/src/components/activity-detail/*` + types.

### P1 — Execution & fatigue-resistance depth

#### ✅ P1-1 · Race-day pacing strategy (split plan)
**What:** For an upcoming `Race`, generate a split-by-split target plan — even
splits, negative split, or **GAP/elevation-aware** splits when a course route is
available — anchored to the CP/CV race prediction from
`get_performance_curve_data`. Render a per-km/mile target table (and ideally a
target-power band), with an option to push it to the watch as a structured pace
workout via the existing `app/workout_translator.py` path.
**Rationale:** Stryd's Race Power Calculator/Event Planner and Garmin PacePro are
flagship "execute the race" features; Runna bakes pacing strategy into its plans.
We predict the *time* but never the *splits* — the missing execution half of a
loop whose pieces (race predictions, GAP, workout push) we already own.
**Effort:** M.
**Files:** new `app/pacing.py` (or extend `app/threshold.py`) for the split model,
`app/api.py` (`/races/{id}/pacing` endpoint), reuse `app/workout_translator.py` for
optional push, `app/ai_coach.py` context, new `frontend/src/components/plan/` or
`today/` race-pacing card + hooks/types.

#### P1-2 · Durability / endurance score (fatigue resistance)
**What:** Quantify the ability to **sustain** performance: compare each athlete's
mean-maximal power/GAP-speed *late* in long/fatigued efforts against their fresh
curve (`Activity.mean_max_json`), yielding a durability/fatigue-resistance index
and trend. Surface in Trends alongside the performance curve and feed it to the AI.
**Rationale:** Garmin Endurance Score and Stryd's durability monitoring treat this
as a flagship metric, and it's a genuine blind spot — our curves capture *peak*
ability but say nothing about *holding* it deep into a race. Reuses the mean-max
machinery already computed and stored per activity.
**Effort:** M.
**Files:** new helper (over `Activity.mean_max_json` + `app/streams.py`),
`app/api.py` (trend endpoint), `app/ai_coach.py` context,
`frontend/src/components/trends/*` + hooks/types.

#### ✅ P1-3 · Harden AI plan generation (structured output)
**What:** Replace fragile free-text JSON parsing in `generate_training_plan` with
provider **structured-output / tool-use** (Claude tool schema; Gemini
`response_schema`) so the model returns schema-valid plan objects, and raise the
plan-generation token budget above the current `max_tokens=4096`
(`app/ai_coach.py:1509`) so a long 4-week plan can't truncate mid-JSON. Keep
fence-stripping as a fallback.
**Rationale:** Directly addresses the `CURRENT_STATE.md` "AI Plan/JSON Parsing
Reliance" gap — today a truncated or malformed response yields an empty/partial
plan and a vague "check AI config". Structured output makes plan generation
trustworthy, which everything plan-related (realignment, push-to-watch) depends on.
**Effort:** M.
**Files:** `app/ai_coach.py` (`generate_training_plan`, `_parse_plan_json`,
provider call sites), possibly `app/config.py` (per-call token budgets).

### P2 — Reliability, breadth, and coaching depth

#### ✅ P2-1 · Durable AI task queue
**What:** Replace inline / short-lived-daemon-thread AI execution (on-demand
re-analysis and plan generation) with a **persisted job ledger** + worker, so a
slow/failed provider call neither blocks the request nor is lost on restart, and
retries are recorded. APScheduler already runs in-process — a `Job` table polled by
a lightweight worker keeps the dependency footprint flat.
**Rationale:** The `CURRENT_STATE.md` "Synchronous AI on Request Paths" gap. As the
coach becomes interactive (P0-1) and execution-critical (P1-1/P1-3), durable,
observable AI execution becomes the backbone rather than a nicety.
**Effort:** M–L.
**Files:** `app/models.py` + Alembic (`Job`/task ledger), `app/main.py` (worker
loop / scheduler job), `app/ai_coach.py` (enqueue instead of inline), `app/api.py`
(enqueue + status endpoints), frontend "analysis in progress" states.

#### ✅ P2-2 · Strength & mobility content depth
**What:** Turn the plan's strength/cross days from a prose target into **concrete,
selectable sessions** — a small library of strength/mobility routines (the prompt
already references "running durability" exercises at `app/ai_coach.py:1100`) with
sets/reps and optional links, rendered as a real session rather than a label.
**Rationale:** Runna's holistic support (strength, mobility, injury prevention) is
a recurring differentiator; we prescribe `cross`/strength days but the surface is
thin. Builds on the plan schema already in place.
**Effort:** M.
**Files:** `app/ai_coach.py` (plan prompt/schema), possibly a seeded routine table
in `app/models.py`, `frontend/src/components/plan/*` + `workout-detail/*`.

#### ✅ P2-3 · Per-interval adherence — close the granularity gap
**What:** Push the lap↔step alignment further so a workout that hits the right
*totals* with the wrong *internal structure* scores correctly — per-rep pace/
distance deltas weighted into the score, surfaced rep-by-rep.
**Rationale:** The `CURRENT_STATE.md` "Adherence Granularity" gap still notes
aggregate-leaning scoring; matches Runna/TrainingPeaks execution grading and
sharpens the closed-loop plan's input signal.
**Effort:** M.
**Files:** `app/adherence.py` (`compute_adherence`),
`frontend/src/components/activity-detail/AdherenceCard.tsx` + types.

### P3 — Hygiene & scale (largely independent)

- **P3-1 · Security default / exposure guard.** `auth_enabled=False` trusts the
  dev-user fallback, so a publicly exposed instance leaks all data
  (`CURRENT_STATE.md`). Add a startup guard that refuses (or loudly warns) when
  auth is disabled and the bind address isn't loopback, and document the safe
  default. **S–M.** Files: `app/main.py`, `app/auth.py`, `app/config.py`, docs.
- ✅ **P3-2 · Incremental load & threshold compute.** Cache misses still recompute
  CTL/ATL/TSB and CP/CV from full history per request. Persist a daily series and
  extend incrementally rather than refitting wholesale. **M.** Files:
  `app/training_load.py`, `app/threshold.py`, optional series table in
  `app/models.py`.
- **P3-3 · Model catalog from config/env.** `AVAILABLE_MODELS` still lives in
  `app/config.py` as code; lift the catalog to env/config so new model IDs don't
  require a code edit (`CURRENT_STATE.md` "Config / Catalog Drift"). **S.** Files:
  `app/config.py`, `app/ai_coach.py`.
- ✅ **P3-4 · Garmin schema-drift canary.** The extensive field-name fallback logic in
  `garmin_sync.py`/`adherence.py`/`streams.py`/`workout_translator.py` fails
  silently when Garmin changes shape. Add contract/snapshot tests over recorded
  payloads and a sync-health check that flags when expected fields go missing.
  **M.** Files: `tests/` fixtures, `app/garmin_sync.py` health surface.
- ✅ **P3-5 · History browsing UX.** Activities/daily lists use manual page paging;
  add infinite scroll or a "load all" for long archives
  (`CURRENT_STATE.md` "Pagination UX"). **S–M.** Files:
  `frontend/src/components/activities/*`, `daily/*`, `frontend/src/api/` hooks.

---

## 4. Suggested sequencing

- **Phase A — make the coach interactive:** P0-1 (chat) + P0-2 (decoupling/EF).
  P0-2 is a fast win that also enriches the chat's context.
- **Phase B — close the execution & durability loop:** P1-1 (race pacing) → P1-2
  (durability) → P1-3 (structured plan output). P1-3 de-risks everything plan-side.
- **Phase C — make AI execution durable:** P2-1 (task queue), now that chat and
  pacing make AI execution central; then P2-2 / P2-3 depth.
- **Throughout:** P3 hygiene in parallel — land **P3-1 (security guard)** early,
  it's the only item with real downside risk. Keep the suite green (coverage gate
  80%; ~414 backend tests today).

---

## 5. Sources

- Runna — [Training plans / pacing & audio guidance](https://www.runna.com/training/training-plans), [Plan Realignment](https://support.runna.com/en/articles/10026375-how-to-use-the-plan-realignment-feature)
- TrainingPeaks — [Feature updates](https://www.trainingpeaks.com/trainingpeaks-feature-updates/), [Structured Workout Builder](https://help.trainingpeaks.com/hc/en-us/articles/235164967-Structured-Workout-Builder)
- Garmin — [Endurance Score](https://www.garmin.com/en-US/garmin-technology/running-science/physiological-measurements/endurance-score/), [Hill Score](https://www.garmin.com/en-GB/garmin-technology/running-science/running-dynamics/hill-score/), [Training Readiness factors](https://the5krunner.com/garmin-features/training/training-readiness/), [Real-Time Stamina](https://wiki.garminrumors.com/Real-Time_Stamina), [PacePro & performance features](https://the5krunner.com/garmin-features/performance/)
- Stryd — [Race Power Calculator & Event Planner](https://support.stryd.com/hc/en-us/articles/360049511054-Race-Power-Calculator-and-Event-Planner), [Stryd metrics (LSS, durability)](https://help.stryd.com/en/articles/6879522-stryd-metrics), [Power Duration Curve](https://help.stryd.com/en/articles/6879351-power-duration-curve-pdc)
- AI-native coaches — [HumanGO ("Hugo")](https://humango.ai/app), [TrainAsONE](https://www.trainasone.com/), [Best AI running coach 2026 (conversational vs. black-box)](https://stas.run/en/guides/ai-running-coach), [Coach Leo](https://coachleo.ai/best-ai-running-coach)
- Intervals.icu — [Fitness/Fatigue/Form](https://www.intervals.icu/features/fitness-chart/), [Custom charts & wellness](https://www.intervals.icu/features/wellness/)
- Tooling — [python-garminconnect](https://github.com/cyberjunky/python-garminconnect)
