# Running Coach — Improvement Plan (v5)

_Last updated: 2026-07-01_

The v4 plan (2026-06-30) has been **fully delivered**. Benchmarked against
[`CURRENT_STATE.md`](./CURRENT_STATE.md), every v4 item now ships:
**weather-adjusted pace & heat coaching**, **chat tool-use** (the coach acts on
the conversation), **persistent coach memory**, **daily readiness-driven plan
adaptation**, **terrain/GAP-aware race pacing**, **fuelling & hydration
guidance**, **race-aware taper/recovery**, **explicit RSB guidance**,
**season-long periodization**, **strength progression + demos**, **user-defined
custom charts**, and **security hardening** (startup refusal on unauthenticated
public binds).

So the coach now sees context, adapts the day, and acts on conversation. This v5
plan benchmarks the app **as it exists today** against a refreshed mid-2026
competitive set and targets what that parity has exposed: **a coach that only
speaks when spoken to, an athlete who is measured but never asked, milestones
that pass uncelebrated, and race plans that ignore race-day conditions** — plus
the architecture debt that three delivered plan cycles have accumulated in two
monolith modules.

It is a **plan only** — no code has been changed.

---

## 1. Comparison set & central finding

| App | Paradigm | What it does that we don't (yet) |
|---|---|---|
| **Garmin Connect+ (Active Intelligence)** | Proactive AI companion | **Push-notification insights** — the coach initiates: timely nudges from health/activity data without opening the app; a 140+ chart performance dashboard; food logging with dynamic macro targets |
| **Runna (2026)** | Adaptive prescriptive plans | **Workout Briefings** — personalized, motivating pre-workout guidance before every session; plan continuity ("build on previous training, don't reset"); schedule-ahead plans |
| **TrainingPeaks Premium** | Analytical + structured | **Peak Performances** — automatic detection & celebration of new personal bests across durations/distances; athlete-visible advanced analytics and HRV charts |
| **Stryd** | Power-based execution | **Event Planner conditions modelling** — race predictions and target splits adjusted for race-day **temperature, humidity, altitude**, and a personal fatigue factor, refined continuously from the last 90 days |
| **Intervals.icu** | Analytics platform | **Subjective wellness logging** (fatigue, soreness, mood, motivation scales) feeding the load model; **season-over-season power-curve comparison**; multi-sport load tracked per discipline |
| **Coach Leo / HumanGO ("Hugo")** | AI-native conversational | Daily **feel-based** adaptation ("adapts to how you actually feel"); injury-pattern early warning (ramp/10%-rule flags acted on, not just shown); genuinely multi-sport plans |

**Central finding (v5):** the app now computes, converses, and adapts — but it is
**reactive, sensor-only, and mute outside the app**. The remaining gaps cluster
into four themes, and — as in every prior cycle — most high-leverage items
**reuse data and infrastructure already in the codebase**:

1. **The coach only speaks when spoken to.** Insights, readiness, plan-adaptation
   suggestions, weekly reviews, and re-auth flags are all generated server-side on
   schedules — then sit invisible until the athlete opens the PWA. There is **no
   outbound channel at all**: `static/sw.js` is cache-only (no `push` handler),
   and nothing in the backend can send a notification. Garmin's Active
   Intelligence has made proactive, bite-sized push insights the ambient-coach
   baseline. Everything worth pushing already exists as a row in `Insight`,
   `PlanAdaptationSuggestion`, or `SyncStatus`.
2. **The athlete is measured but never asked.** Readiness is 100% device-derived
   (sleep, stress, body battery, RHR, HRV — `compute_readiness` has no subjective
   term), and activity feedback is a good/bad toggle with tags. There is **no RPE
   anywhere** (grep confirms), so a run with no HR/power falls to a duration-only
   TSS floor when Foster's sRPE (RPE × minutes) is the standard fallback, and the
   coach can't distinguish "legs felt dead" from a clean easy day. Intervals.icu
   treats subjective scales as first-class wellness inputs; Coach Leo's pitch is
   literally "adapts to how you actually feel."
3. **Milestones pass silently and races ignore conditions.** We compute
   mean-maximal curves on every sync but never notice a **new all-time best**
   (`threshold.py` uses "new best" only for cache invalidation) — TrainingPeaks
   celebrates Peak Performances automatically. And race pacing is terrain-aware
   (v4) but **conditions-blind**: we adjust *past* pace for heat
   (`app/weather.py`) yet hand the athlete flat-weather target splits for a July
   marathon, while Stryd's Event Planner folds temperature/humidity into every
   race target.
4. **Three delivered plan cycles have piled features into two monoliths.**
   `app/ai_coach.py` (2,586 lines: context, providers, chat, tools, plans, jobs)
   and `app/api.py` (2,206 lines, ~53 routes) are where every new feature lands,
   and the AI job worker executes jobs **serially in the scheduler thread**. None
   of this blocks today's single-tenant deployment, but each future item pays a
   growing tax.

---

## 2. Gap matrix (today)

Legend: ✓ full · ◑ partial · ✗ absent

| Capability | Running Coach (today) | Garmin | Runna | TrainingPeaks | Stryd | Intervals.icu | Coach Leo/Hugo |
|---|---|---|---|---|---|---|---|
| Proactive push notifications / ambient insights | ✗ (all in-app) | ✓ (Active Intelligence) | ◑ | ◑ | ◑ | ◑ | ◑ |
| PR / peak-performance detection & celebration | ✗ (curves computed, bests unnoticed) | ✓ | ◑ | ✓ | ✓ | ✓ | ✗ |
| Subjective RPE / soreness / mood input | ✗ | ◑ | ◑ | ◑ (feel/RPE) | ✗ | ✓ | ✓ |
| sRPE load fallback (no-sensor sessions) | ✗ (duration floor) | ✗ | ✗ | ✓ | ✗ | ✓ | ◑ |
| Conditions-aware race pacing (temp/humidity) | ✗ (terrain only) | ◑ (PacePro: terrain) | ◑ | ✗ | ✓ (Event Planner) | ✗ | ✗ |
| Pre-workout briefing | ✗ (insights are post-hoc) | ◑ | ✓ (Workout Briefings) | ✗ | ◑ | ✗ | ✓ |
| Injury-risk early warning that *acts* | ◑ (ACWR/ramp shown; RSB advice) | ◑ | ◑ | ◑ | ◑ | ◑ | ✓ |
| Season-over-season curve/progress comparison | ✗ (single fitted curve) | ◑ | ◑ | ✓ | ✓ | ✓ | ✗ |
| Multi-sport load accounting | ◑ (all types synced; TSS chain sport-agnostic but unaudited; thresholds run-only) | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Food logging / macro tracking | ✗ (fuelling targets only) | ✓ (Connect+ 2026) | ◑ | ✗ | ✗ | ◑ | ✗ |
| Conversational coach that acts + remembers | ✓ (v4) | ◑ | ◑ | ✗ | ✗ | ✗ | ✓ |
| Daily readiness-driven adaptation | ✓ (v4) | ✓ (DSW) | ◑ | ✗ | ◑ | ✗ | ✓ |
| Terrain-aware race pacing | ✓ (v4) | ✓ | ◑ | ◑ | ✓ | ✗ | ✗ |
| Season periodization + custom charts | ✓ (v4) | ◑ | ◑ | ✓ | ◑ | ✓ | ◑ |

Deliberately **out of scope**: food logging / macro tracking (Garmin Connect+'s
2026 flagship). It needs a food database, barcode/image recognition, and daily
logging UX — an app-sized effort orthogonal to coaching. Our fuelling *targets*
(v4) cover the coaching-relevant slice.

---

## 3. Prioritized improvements

Ordered by **impact ÷ effort**, favoring reuse of data and infrastructure already
present. Effort key: **S** ≈ <1 day · **M** ≈ 1–3 days · **L** ≈ several days.

### P0 — The coach speaks first

#### P0-1 · Web Push notifications (proactive coach delivery) ✅ Done.
**What:** Add an outbound channel: standard **Web Push** (VAPID + `pywebpush`) on
the PWA we already ship. A `PushSubscription` model stores per-user browser
subscriptions; a new `app/notifications.py` exposes `notify(user_id, category,
title, body, url)` with per-category opt-outs persisted in `SyncStatus`. Wire it
into the events that already exist: new AI insight after an activity syncs, a
plan-adaptation suggestion on a low-readiness morning, the weekly review landing,
`garmin_needs_reauth` flips (today this fails silently until the user visits
Settings), race-week reminders, and PR events (P0-2). `static/sw.js` gains
`push` + `notificationclick` handlers that deep-link into the SPA route; Settings
gains a "Notifications" section (permission request, category toggles).
**Rationale:** The single biggest paradigm gap in the matrix. Every competitor's
2026 direction is the coach *initiating* — Garmin's Active Intelligence is
exactly this. We already generate everything worth pushing on schedules; it just
sits unread. This also multiplies the value of v4 features: a readiness-driven
downgrade suggestion is far more useful at 6:45am on your phone than discovered
at lunch. No polling, no native apps — the PWA + service worker are already
installed on the athlete's phone.
**Effort:** M–L.
**Files:** `app/notifications.py` (new), `app/models.py` (`PushSubscription`) +
`alembic/versions/` (migration), `app/config.py` (`vapid_private_key`,
`vapid_subject`), `app/api.py` (`POST/DELETE /push-subscriptions`,
`GET/PUT /notification-preferences`), `app/schemas.py`, call sites:
`app/ai_coach.py` (after insight save / weekly review / plan generation),
`app/garmin_sync.py` (`mark_garmin_needs_reauth`), `app/main.py` (daily job:
adaptation-suggestion + race-week pushes), `static/sw.js` (push handlers),
`frontend/src/components/settings/NotificationsSection.tsx` + `.css` (new),
`frontend/src/api/{types,hooks,client}.ts`, `requirements.txt` (`pywebpush`),
`tests/test_notifications.py` (new), `tests/test_api_endpoints.py`.
_Implemented as described, with two adjustments the post-P3-1 codebase and
correctness required. First, file locations: routes and AI-coach logic now
live in `app/routers/*` and `app/coach/*` (P3-1), not the pre-split
`app/api.py`/`app/ai_coach.py` monoliths the plan predates — the new
`app/routers/notifications.py` is mounted alongside the other per-domain
routers, and call sites were added in `app/coach/jobs.py` (`analyze_activity`),
`app/coach/plans.py` (`weekly_review`), `app/garmin_sync.py`
(`mark_garmin_needs_reauth`'s False→True flip and personal-record detection
in `sync_activities`). Second, config: subscribing a browser via
`PushManager.subscribe()` needs the VAPID **public** key on the client, so
`app/config.py` also gained `vapid_public_key` alongside `vapid_private_key`/
`vapid_subject` (exposed read-only via `GET /push/vapid-public-key`).
`notify()` no-ops quietly when VAPID keys aren't set, so unconfigured
deployments and the test suite are unaffected. The readiness-driven
plan-adaptation suggestion and race-week reminder are computed once per
morning sync in two new `app/main.py` helpers
(`_push_plan_adaptation_if_needed`, `_push_race_week_reminders`), each
deduped through a `SyncStatus` row so a re-run of the daily sync never
double-pushes. All new and existing tests pass (859 backend, 57 frontend);
`npm run build` and `tsc -b` are clean._

#### P0-2 · Personal records & peak performances ✅ Done.
**What:** Detect and celebrate bests from data we already compute. After
`compute_curves_from_details` stores an activity's mean-max curve, compare each
standard duration against the athlete's historical frontier (and race-distance
efforts against fastest-known 5K/10K/half/marathon times); persist any new best
as a `PersonalRecord` row (duration/distance, value, activity_id, previous
value, date). Surface: a "New PB" badge on Activity Detail and the activity
list, a Peak Performances panel (all-time + last-90-days bests) on Trends, a
one-line entry in the AI activity context ("set a new 20-min GAP-speed best —
clear fitness signal"), and a push via P0-1.
**Rationale:** TrainingPeaks' Peak Performances and Strava's PR machinery show
this is core motivation mechanics, and we are unusually well-positioned: the
mean-max frontier already exists per-activity and in aggregate
(`Activity.mean_max_json`, `threshold.py`'s frontier assembly) — today it's used
for CP fitting and then discarded from the athlete's view. Pure detection +
presentation over stored data; no new sync.
**Effort:** S–M.
**Files:** `app/records.py` (new — frontier comparison, distance-PR extraction),
`app/models.py` (`PersonalRecord`) + migration, `app/garmin_sync.py` (hook after
curve computation), `app/ai_coach.py` (`_format_activity_context` PR line),
`app/api.py` (`GET /personal-records`; PR flags on `ActivityDetail`),
`app/schemas.py`, `frontend/src/components/trends/PeakPerformancesView.tsx` +
`.css` (new), `frontend/src/components/activity-detail/ActivityDetailView.tsx`
(badge), `frontend/src/api/{types,hooks}.ts`, `tests/test_records.py` (new).
_Implemented as described, scoped to P0-2 only (no push — that's P0-1, not yet
built). Duration-based bests (power/GAP-speed per standard mean-max duration)
and race-distance "Best Efforts" (Strava's 400m/1-2mi/5K.../Marathon set) are
both append-only `PersonalRecord` rows, detected incrementally after each
live-synced activity (`garmin_sync.sync_activities`) by comparing only against
activities with an earlier `started_at` — order-independent by date, not by
sync order. Because `backfill_activities` imports pages newest-first,
per-activity detection is skipped there and a single chronological
`rebuild_personal_records` pass runs once backfill completes; a versioned
`SyncStatus` flag (`ensure_records_backfilled`) also lazily re-mines full
history on the first request after any detection-logic change, so accounts
whose backfill predates this feature (or a later revision of it) aren't stuck
with an empty panel. Race-distance bests are **rolling-window best efforts**,
not whole-activity distance matching: `app.streams.compute_distance_efforts`
finds the fastest contiguous stretch of each standard distance anywhere within
an activity's distance/time stream (two-pointer sweep, linearly interpolated
crossing time), so a half marathon race correctly yields a 5K and 10K best
effort too, exactly like Strava. Surfaced via `GET /personal-records`
(Trends → Records tab: a Strava-style distance-chip picker showing the top-3
historical bests per distance, a Duration Bests grid, and a recent-window
feed) and a `personal_records` field on `ActivityDetail` (New PB badge); the
AI activity-analysis context gets a one-line PR mention when applicable. All
new/existing tests pass (backend + frontend)._

### P1 — Ask the athlete, plan the real race

#### P1-1 · Subjective feedback: per-run RPE + daily check-in ✅ Done.
**What:** Two small subjective inputs, both feeding existing models. (a)
**Per-activity RPE (1–10)** added to the existing feedback prompt (rating/tags/
text already flow through `POST /activities/{id}/feedback`); stored on
`Activity.rpe`. Insert **sRPE TSS** (Foster: RPE × duration-minutes, normalized)
into the TSS fallback chain in `training_load.py` between hrTSS and the
duration-only floor, so sensor-less runs carry honest load. (b) A **daily
check-in** (soreness, energy, mood — three 1–5 taps on Today, skippable) stored
in a `DailyCheckin` row; when present, readiness gains a subjective component
(reweighting the existing composite) and the AI context gets a "how the athlete
says they feel" line. Persistent soreness in one area auto-suggests a
`CoachMemory` niggle via the existing chat-tool path.
**Rationale:** The coach knows the athlete's HRV to the millisecond but has never
asked how they feel. Intervals.icu treats subjective scales as first-class
wellness; Coach Leo/Hugo's differentiator is feel-based adaptation; TrainingPeaks
collects post-workout feel/RPE. Closes the loop with v4's readiness-driven
adaptation — a "legs dead" check-in should downgrade today just like a bad HRV.
All plumbing (feedback endpoint, readiness composite, context builder, memory)
already exists.
**Effort:** M.
**Files:** `app/models.py` (`Activity.rpe`, `DailyCheckin`) + migration,
`app/training_load.py` (sRPE in `_activity_tss`, subjective readiness component),
`app/api.py` (feedback endpoint accepts `rpe`; `POST /daily-checkin`; Today
response carries today's check-in), `app/schemas.py`, `app/ai_coach.py` (context
lines), `app/plan_adaptation.py` (soreness folds into bands),
`frontend/src/components/activity-detail/FeedbackPrompt.tsx` (RPE selector),
`frontend/src/components/today/DailyCheckinCard.tsx` + `.css` (new),
`frontend/src/api/{types,hooks}.ts`, `tests/test_training_load.py`,
`tests/test_readiness.py`, `tests/test_api_endpoints.py`.
_Implemented as described, scoped to P1-1 only. File locations follow the
post-P3-1 split: routes landed in `app/routers/daily.py` (`/today`,
`POST /daily-checkin`), `app/routers/activities.py` (feedback `rpe`), and
`app/routers/plan.py` (adapt-day re-derivation now also reads the day's
check-in); context lines landed in `app/coach/context.py`. The sRPE branch
reuses the existing `_intensity_to_tss` helper with `intensity = rpe / 10`,
so it sits on the same 100-TSS-per-threshold-hour scale as the pace/HR
branches instead of introducing a separate arbitrary-units metric. The
subjective readiness component is a new `"subjective": 0.20` entry in the
existing weights dict — averaging whichever of soreness/energy/mood were
tapped (1=worst, 5=best) onto 0–100 — and folds in for free via the
composite's existing "exclude missing components" normalization.
`plan_adaptation.suggest_adaptation` gained a direct check-in override
(severe soreness or low energy/mood forces a downgrade on a hard day even
when the composite score alone is "Good", the same way a bad HRV night
would), rather than relying solely on the diluted composite score to move
the reading across a band. "Persistent soreness in one area" is detected
from an optional free-text `soreness_note` on the check-in (no per-body-part
UI): three consecutive check-ins reporting soreness ≤2/5 with a matching
note auto-record a `CoachMemory` niggle directly (same shape as the
chat `mark_setback` tool), deduplicated so it's written once per area. All
new and existing tests pass (893 backend); `npm run build`, `tsc -b`, and
the Vitest suite (57 cases) are clean._

#### P1-2 · Conditions-aware race pacing ✅ Done.
**What:** Fold expected race-day conditions into the pacing plans from v3/v4.
`GET /races/{id}/pacing` accepts optional `expected_temp_c` / `expected_dew_point_c`
(UI inputs on the pacing card, pre-filled from the median conditions of the
athlete's recent weathered runs via the existing `recent_heat_stress` machinery);
reuse `heat_pace_adjustment` to scale every split's target and annotate the
response: "at 24°C / dew point 18°C your 3:30 goal costs ~+6 min — adjusted
splits below, or retarget." Composes with the terrain strategy (grade and heat
multiply). The push-to-watch path is unchanged — it just receives the adjusted
splits.
**Rationale:** Stryd's Event Planner treats temperature/humidity as core inputs
to race targets; we built the exact heat model in v4 (`app/weather.py`) and apply
it only retrospectively. This is the same formula pointed forward — no forecast
API dependency (user-entered/estimated conditions keep it self-hosted-friendly),
and it prevents the classic blow-up the entire pacing feature exists to avoid.
**Effort:** S–M.
**Files:** `app/pacing.py` (conditions factor on split targets),
`app/api.py` (pacing endpoints accept conditions; default-estimate helper),
`app/schemas.py` (`PacingStrategyResponse.conditions_*` fields),
`frontend/src/components/today/RacePacingCard.tsx` + `.css` (temp/dew-point
inputs, cost line), `frontend/src/api/types.ts`, `tests/test_pacing.py`,
`tests/test_api_endpoints.py`.

#### P1-3 · Pre-workout briefing (Runna-style) ✅ Done.
**What:** A short, personalized **briefing for today's session**, generated as an
`AIJob` after the morning daily sync (and on demand from the workout card):
why this session matters in the current season phase, concrete execution targets
(paces/zones from the plan day), a readiness/adaptation note ("readiness 78 —
run it as written"), fuelling if long (P2-1 data from v4), and a conditions
one-liner. Stored as a new `Insight` type (`briefing`) so history/dismissal come
free; rendered as a card on Today above the workout; pushed via P0-1 for
athletes who opt in.
**Rationale:** Runna's 2026 headline feature. All our AI output is *post-hoc*
(analysis after the run, review after the week) — the one moment a coach is most
valuable, right before the session, is silent. Every ingredient exists:
`_build_context`, the plan day, readiness, the season skeleton, fuelling,
weather, the job queue, and the insight store. This is a prompt + a hook + a
card.
**Effort:** M.
**Files:** `app/ai_coach.py` (`generate_briefing` + prompt, new job type in
`execute_job`, hook in daily-sync path), `app/main.py`
(`run_daily_sync_for_user` enqueues briefing when a plan day exists),
`app/api.py` (`POST /training-plan/days/{id}/briefing`; Today response includes
latest briefing insight), `app/schemas.py`,
`frontend/src/components/today/BriefingCard.tsx` + `.css` (new), `TodayView.tsx`,
`frontend/src/api/{types,hooks}.ts`, `tests/test_ai_coach.py`,
`tests/test_job_queue.py`.
_Implemented as described, scoped to P1-3 only. File locations follow the
post-P3-1 split: `generate_briefing` and its prompt/context helper
(`_build_briefing_trigger_data`) landed in `app/coach/plans.py` alongside
`generate_training_plan`/`weekly_review`, with a `"generate_briefing"` branch
added to `execute_job` in `app/coach/jobs.py` and both re-exported through the
`app/ai_coach.py` shim; the on-demand endpoint landed in
`app/routers/plan.py`, and the Today wiring (`plan_day_id` + `briefing`
fields) in `app/routers/daily.py`/`app/schemas.py`. Rather than duplicate the
retry/backoff dispatch in `app/coach/providers.py`, `_call_claude`/
`_call_gemini`/`_call_ai` gained an optional `system_prompt` override (default
unchanged) so the briefing gets its own forward-looking prompt instead of the
generic post-hoc-analysis one, and `_extract_summary_and_category` gained a
`"briefing"` category. The trigger data is deliberately thin (today's
scheduled session, the plan's phase/overview, and a fuelling reminder for
long efforts via the existing `app/nutrition.py` helper) — it's handed to the
existing `_build_context`, which already contributes readiness (including the
heat-stress one-liner from `app/weather.py`), profile, and load, so no new
context plumbing was needed. The daily-sync hook
(`main._generate_briefing_if_needed`) mirrors the P0-1 push
helpers exactly: it enqueues (rather than calls inline) so the AI call runs on
the job worker, not the scheduler thread, deduped per plan day via
`SyncStatus` the same way `_push_plan_adaptation_if_needed` is. On the
frontend, `BriefingCard.tsx` shows the generated note (Markdown) with a
regenerate affordance, or a "Generate briefing" button when a plan day exists
for the selected date but no briefing yet — polling the job the same way
`ActivityDetailView`'s re-analyze flow does, via the existing `useJobStatus`
hook. All new and existing tests pass (940 backend); `npm run build`, `tsc
-b`, and the Vitest suite (57 cases, unchanged — new React Testing Library
component coverage is P3-3's scope, not this item's) are clean._

### P2 — Sharper analysis, honest load

#### P2-1 · Injury-risk early warning that acts ✅ Done.
**What:** Promote the ACWR / ramp-rate / `injury_risk` flags (computed daily in
`DailyLoadSeries`) plus active `CoachMemory` niggles into a proactive loop: when
risk crosses into "high" — even on a good-readiness day — surface a caution card
on Today, generate a rule-based cutback suggestion through the existing
`plan_adaptation` accept/dismiss path (extended with a `risk` trigger alongside
readiness bands), inject a mandatory "load caution" directive into the plan/chat
context, and push via P0-1.
**Rationale:** We already compute exactly what the AI-coach crowd markets as
injury prevention (10%-rule ramp flags, ACWR bands) — but it's displayed, not
acted on. HumanGO adjusts plans when athletes report injuries; our v4 adaptation
loop reacts to readiness but not to load trajectory. Cheap: detection exists,
the suggestion/accept mechanism exists; this connects them.
**Effort:** S–M.
**Files:** `app/plan_adaptation.py` (risk-triggered suggestions),
`app/api.py` (Today attaches risk caution), `app/ai_coach.py` (context
directive), `app/schemas.py`,
`frontend/src/components/today/PlanAdaptationCard.tsx` (risk variant),
`tests/test_plan_adaptation.py`, `tests/test_api_endpoints.py`.
_Implemented as described, scoped to P2-1 only. File locations follow the
post-P3-1 split: the three call sites that compute the readiness-driven
suggestion — `app/routers/daily.py` (`/today`), `app/routers/plan.py`
(`/training-plan/adapt-day`), and `app/main.py`
(`_push_plan_adaptation_if_needed`) — now also pass the day's
`TrainingLoadPoint.injury_risk` and the athlete's most recent active niggle
(a new `plan_adaptation.get_active_niggle` helper) into `suggest_adaptation`.
A `risk` branch fires a hard-day downgrade whenever `injury_risk == "high"`
or a niggle is active, ahead of the readiness-band checks, so it applies even
on a Good/Excellent readiness day; it does not override the more severe
low-readiness rest recommendation. The same risk flag also suppresses the
easy-day upgrade nudge — the coach never suggests "add more" while risk is
elevated. `PlanAdaptationSuggestion` gained a `trigger`
(`"readiness" | "checkin" | "risk"`) field (default `"readiness"`, so no
existing behavior changed) that the same push path
(`_push_plan_adaptation_if_needed`) and the same `PlanAdaptationCard` read to
title/style the risk case distinctly — no new push category or UI component,
reusing the P1-1/P0-1 plumbing end to end. The "mandatory" plan/chat context
directive landed in `training_load.format_training_load_context` (shared by
`app/coach/context.py` and `app/coach/plans.py`), appended only when
`injury_risk == "high"`. All new and existing tests pass (backend + `tsc -b`
+ Vitest)._

#### P2-2 · Season-over-season performance comparison ✅ Done.
**What:** Add a comparison overlay to the Performance Curve view: the fitted
power/GAP-pace curve and mean-max frontier for the **current window vs a prior
period** (previous 90 days, same period last year, or a custom range), plus
delta callouts ("threshold pace 8 s/km faster than March"). Backend: parameterize
the existing frontier/fit assembly by date range (the incremental cache covers
"current"; comparison windows are computed on demand and cached in `SyncStatus`
by range fingerprint). Custom charts gain an optional comparison series.
**Rationale:** Intervals.icu's "compare your power curve across seasons" and
TrainingPeaks' progress views make longitudinal comparison the payoff of all this
data collection; we fit one curve and show only *now*. Reuses `threshold.py`
wholesale — this is a windowing parameter and a second line on an existing chart.
**Effort:** M.
**Files:** `app/threshold.py` (windowed frontier/fit), `app/api.py`
(`GET /performance-curve?compare=...`; custom-chart comparison param),
`app/schemas.py`,
`frontend/src/components/trends/PerformanceCurveView.tsx` + `.css`,
`frontend/src/components/trends/CustomChartsView.tsx`,
`frontend/src/api/{types,hooks}.ts`, `tests/test_threshold.py`,
`tests/test_custom_charts.py`.
_Implemented as described, scoped to P2-2 only. `app/threshold.py` gained a
window-parameterized `_curve_for_window`/`_fit_window_curves` pair (extracted
from the old `get_performance_curve_data`, which is now a thin wrapper over
the `[now-lookback_days, now)` window), `resolve_comparison_window` for the
three modes, and a `SyncStatus`-backed range-fingerprint cache
(`_curve_for_window_cached`) so a comparison window's CP/CV fit isn't redone
on every request. `get_performance_curve_data` takes an optional `compare`
plus custom bounds and attaches a `PerformanceCurveWindow` + signed
`ComparisonDelta` list (CP, threshold pace) to its result. The endpoint (in
`app/routers/trends.py`, the post-P3-1 split location, not `app/api.py`) adds
`compare`/`compareStart`/`compareEnd` query params with 400s on bad custom
ranges. Custom charts' `/custom-charts/data` gained a `compare` boolean that
returns a second `compare_points` array for the immediately preceding period;
since the two periods' calendar dates don't overlap, `CustomChartPoint` grew a
`day_index` (days since that period's start) so the frontend aligns series by
offset instead of date. `PerformanceCurveView` adds a comparison-mode
selector (previous period / year ago / custom date range) with a second
dashed chart line and delta callout chips; `CustomChartsView` adds a "Compare
to previous period" checkbox that overlays a muted dashed line per selected
metric. All new and existing tests pass (backend pytest, `tsc -b`, Vitest)._

#### P2-3 · Multi-sport load audit & explicit handling ✅ Done.
**What:** Make non-running load honest and visible. Today the sync stores **all**
activity types and the TSS chain is nominally sport-agnostic, but it was designed
for runs (rTSS assumes running pace; thresholds filter to `_is_run`). Audit and
formalize: hrTSS for rides/other HR-bearing sessions, duration-floor (or sRPE
via P1-1) for strength/yoga, never rTSS for non-runs; tag `DailyLoadSeries`
contributions by sport; show a per-sport split on the training-load chart; note
cross-training load in the AI context ("Tuesday's 90-min ride added ~55 TSS").
**Rationale:** The plan prescribes cross/strength days, and readiness/ACWR feed
adaptation — if a hard ride contributes wrong (or accidental) load, the whole
adaptive loop is skewed. Intervals.icu/TrainingPeaks/Garmin all account
multi-sport load; ours is currently *implicit and unaudited*. Mostly verification
+ small fixes + presentation.
**Effort:** S–M.
**Files:** `app/training_load.py` (sport-aware TSS dispatch, per-sport
aggregation), `app/api.py` (training-load response sport split),
`app/schemas.py`, `app/ai_coach.py` (context line),
`frontend/src/components/today/TrainingLoadChart.tsx`,
`tests/test_training_load.py` (ride/strength fixtures).
_Implemented as described, scoped to P2-3 only. The audit found a real bug, not
just missing presentation: `avg_pace_min_km` is computed for **every** synced
activity regardless of sport (`garmin_sync._extract_activity_fields`), so a
ride's much faster generic distance/time ratio was being read as a running
pace and fed straight into rTSS — wildly overstating a bike ride's intensity
and, downstream, CTL/ATL/ACWR/injury-risk. `app/training_load.py` gained a
`sport_category()` classifier (`run` / `ride` / `swim` / `strength` / `other`,
matched against Garmin `typeKey` substrings) and its `is_run()` helper now
gates the pace-based branch in `estimate_tss`; hrTSS and the sRPE/duration
floor were already sport-agnostic and needed no change. `_daily_tss_range`
now also returns a per-day `{sport: tss}` breakdown, persisted as a new
`DailyLoadSeries.sport_breakdown_json` column (migration
`q0r1s2t3u4v5`) and surfaced on `TrainingLoadPoint.sport_breakdown` — no new
endpoint needed, it rides along on the existing `GET /training-load`
response. `TrainingLoadChart.tsx` adds a "Load by sport" stacked bar +
legend (aggregated across the visible window) below the existing CTL/ATL/TSB
legend, shown only when more than one sport contributed. The AI context's
"Recent Activities" line now appends `~N TSS` for any non-run session (e.g.
"Evening Ride (cycling) ... ~48 TSS"), reusing the same `estimate_tss` call
the load series uses, so the coach and the chart never disagree. All new and
existing tests pass (backend pytest, `tsc -b`, Vitest, `npm run build`)._

### P3 — Architecture & hygiene (pay down before the next cycle)

- **P3-1 · Split the two monoliths. ✅ Done.** `app/ai_coach.py` (2,586 lines) →
  an `app/coach/` package: `context.py` (context builders), `providers.py`
  (Anthropic/Gemini dispatch + retry), `chat.py` (streaming + chat tools),
  `plans.py` (generation/realignment/periodization), `jobs.py` (AIJob ledger),
  with `app/ai_coach.py` kept as a thin re-export shim so nothing breaks.
  `app/api.py` (2,206 lines, ~53 routes) → `app/routers/` split by domain
  (activities, daily, calendar, plan, races, chat, settings, trends/charts,
  export) mounted on the same `/api/v1` router. **Mechanical, zero behavior
  change, do it before P0/P1 add more weight.** The 745-test suite is the safety
  net. **M–L.** Files: `app/coach/*` (new), `app/routers/*` (new),
  `app/ai_coach.py` / `app/api.py` (shims), test imports.
  _Implemented as described: both shims re-export the full prior surface, and a
  handful of call sites inside `app/coach/*` (db_session opens, provider/job
  dispatch) route through the `app.ai_coach` shim at call time so the existing
  monkeypatch-based tests keep working unchanged. All 795 tests pass._
- **P3-2 · AI-job worker concurrency & sync isolation. ✅ Done.** The worker
  claims up to 5 jobs but runs them **serially in the APScheduler thread**, so
  one slow plan generation delays every user's analysis (and the next
  scheduler tick). Execute claimed jobs on a small `ThreadPoolExecutor` (SQLite
  WAL tolerates this; sessions are per-thread already), keep claiming atomic,
  and add a per-job timeout. Similarly, per-user Garmin sync fan-out is serial
  — a worthwhile follow-up only if multi-tenant use grows; note it, don't build
  it. **S–M.** Files: `app/main.py` (`_worker_run_pending_jobs`),
  `app/ai_coach.py`/`app/coach/jobs.py` (`execute_job` timeout),
  `tests/test_job_queue.py`.
  _Implemented as described. `app/coach/jobs.py`'s `execute_job` was split into
  reusable pieces rather than wrapped: `_claim_job`/`_claim_pending_jobs`
  atomically transition pending → running (single job or a whole batch, one
  transaction each) and return the dispatch fields; `_run_claimed_job` is the
  former dispatch-and-finalize half, now runnable independently on a worker
  thread since it no longer re-claims. `execute_job(job_id)` is now `_claim_job`
  + `_run_claimed_job` — unchanged behavior, so it's still safe for tests and
  any one-off manual call. `app/main.py`'s `_worker_run_pending_jobs` claims a
  batch of up to 5 jobs atomically via `_claim_pending_jobs` *before* any
  dispatch happens (this is what makes claiming safe across overlapping polls
  — a job is `"running"` in the DB the instant it's selected, not whenever its
  pool thread happens to start), then submits each to a module-level
  `ThreadPoolExecutor(max_workers=5)` (`_job_executor`) and waits on each
  future with `future.result(timeout=_JOB_TIMEOUT_SECONDS)` — a new 120s
  constant in `jobs.py`. Since Python can't forcibly stop a thread, a timeout
  doesn't cancel or touch the job's row; the worker just stops waiting and
  moves on, and the job records its own outcome whenever its pool thread
  actually finishes — this is what keeps a single slow call from blocking the
  scheduler thread (and therefore every other scheduled job) past the cap,
  without racing the in-flight thread for the same DB row. `_job_executor`
  shuts down (`wait=False`) alongside the scheduler on app shutdown. Per-user
  Garmin sync fan-out (`_iter_garmin_users` loops in `_scheduled_activity_sync`
  etc.) is unchanged, as scoped. All new and existing tests pass (969
  backend), including a concurrency proof (two jobs rendezvous on a
  `threading.Barrier`, which only both arrive if they truly ran in parallel)
  and a timeout test (worker returns before a deliberately slow job finishes,
  which then completes and self-records shortly after)._
- **P3-3 · Frontend component tests. ✅ Done.** Vitest covers only pure utils
  (57 cases); the adaptive-coaching UI (PlanAdaptationCard, RacePacingCard,
  ChatView action chips, FeedbackPrompt, and the new P0/P1 cards) has zero
  render coverage. Add React Testing Library + a few focused interaction tests
  for the cards that encode coaching decisions. **M.** Files:
  `frontend/package.json`, `frontend/src/components/**/*.test.tsx` (new),
  `vite.config.ts`.
  _Implemented as described. Added `@testing-library/react` and
  `@testing-library/jest-dom` (interactions are simple enough that the
  built-in `fireEvent` covers them — `@testing-library/user-event` wasn't
  needed), switched
  `vite.config.ts`'s Vitest `environment` from `node` to `jsdom`, and added a
  `setupFiles` entry (`src/test/setup.ts`) that wires up jest-dom's matchers,
  registers `@testing-library/react`'s `cleanup()` in `afterEach` (Vitest's
  `globals` option is off in this repo, so RTL's own auto-cleanup — which
  looks for a global `afterEach` — never fires without this), and polyfills
  `Element.prototype.scrollIntoView`, which jsdom doesn't implement and
  `ChatView` calls on every message. `src/test/test-utils.tsx` adds a
  `renderWithQueryClient` helper (a fresh, retry-disabled `QueryClient` per
  render) since every card under test reads or writes through the
  `api/hooks.ts` react-query hooks. Rather than a mocking library, tests stub
  `global.fetch` directly per-case and assert on the request URL/body — this
  matches the codebase's existing pattern where every API call (including
  `ChatView`'s hand-rolled SSE streaming, which isn't on react-query) goes
  through the small `apiGet/apiPost/...` wrappers in `api/client.ts`, so one
  mocking approach covers both. Six new spec files land one per named target
  from the plan text (`PlanAdaptationCard`, `RacePacingCard`, `ChatView`,
  `FeedbackPrompt`) plus two representative P0/P1 cards
  (`DailyCheckinCard` for P1-1, `BriefingCard` for P1-3), covering the
  coaching-relevant branches: downgrade/upgrade/risk-caution framing and the
  accept/dismiss POST bodies; race-pacing expand/collapse, strategy refetch,
  the conditions-cost line, and push-to-watch; RPE chip selection and the
  thumbs-up/thumbs-down → setback-modal → feedback POST flow; chat history
  action chips and a hint-prompt send through a mocked SSE stream; check-in
  scale gating (submit disabled until a tap, soreness ≤3 reveals the note
  field) and the summary/edit toggle; and the briefing generate/regenerate
  flow. All 83 frontend tests pass (57 pre-existing + 26 new); `tsc -b` and
  `npm run build` are clean._
- **P3-4 · Ops observability surface.** The schema-drift canary and AIJob
  failures live in logs and `SyncStatus` — invisible in the UI. Add a compact
  health panel in Settings (last sync per job, canary status, recent failed
  jobs with retry buttons) over data that already exists, and route canary
  alarms + repeated job failures through P0-1 notifications. **S–M.** Files:
  `app/api.py`/`app/routers/settings.py` (`GET /health-detail`),
  `frontend/src/components/settings/SystemHealthSection.tsx` + `.css` (new),
  `tests/test_api_endpoints.py`.

### Architecture assessment (no change recommended)

- **FastAPI + SQLite (WAL) + APScheduler remains right-sized** for the
  self-hosted single/few-tenant reality. Incremental compute (v3/v4) removed the
  read-path hot spots; nothing in v5 needs Postgres, Redis, or an external queue.
  The `AIJob` table-as-queue is the correct durability layer at this scale —
  P3-2's thread pool is the only concurrency change warranted.
- **Web Push (P0-1) is the one genuinely new infrastructure piece** in this plan,
  and it's deliberately the standards-based, dependency-light option (VAPID +
  `pywebpush`, no Firebase/APNs accounts) matching the self-hosted ethos.
- **No forecast-API dependency**: P1-2 uses athlete-entered/estimated conditions
  rather than a weather-service key, keeping zero-config deployments intact.

---

## 4. Suggested sequencing

- **Phase A — pay down, then speak up:** P3-1 (monolith split — everything after
  lands in cleaner homes) → P0-1 (push notifications) → P0-2 (PRs, which
  immediately gives the push channel something delightful to say).
- **Phase B — ask the athlete:** P1-1 (RPE + check-in) → P2-1 (risk-triggered
  adaptation, which benefits from subjective inputs) — together these make the
  adaptive loop feel-aware, not just sensor-aware.
- **Phase C — race realism & the morning coach:** P1-2 (conditions-aware pacing)
  → P1-3 (pre-workout briefing, which can then cite conditions, readiness, and
  fuelling in one card).
- **Phase D — analysis depth:** P2-2 (season comparison) + P2-3 (multi-sport
  audit) as capacity allows.
- **Throughout:** P3-2 whenever the worker is touched; P3-3 alongside each new
  card; P3-4 with P0-1 (shared notification plumbing).

---

## 5. Sources

- Garmin — [Active Intelligence with Garmin Connect+](https://support.garmin.com/en-US/?faq=kWi5DoaMPZ4VCJBA0lFWP7), [Connect+ one-year review (feature timeline)](https://the5krunner.com/2026/04/20/garmin-connect-plus-review/), [Connect+ Performance Dashboard (140+ charts)](https://www.garmin.com/en-US/blog/fitness/what-is-the-garmin-connect-performance-dashboard/), [Nutrition tracking in Garmin Connect (CES 2026)](https://www.garmin.com/en-US/newsroom/press-release/sports-fitness/stay-on-top-of-nutrition-goals-in-garmin-connect/)
- Runna — [2026 app updates: Workout Briefings, adaptive plans, plan continuity](https://www.runningwestwardho.co.uk/post/runna-app-updates-2026-smarter-training-plans-adaptive-coaching-new-features-explained), [Adapting your training](https://support.runna.com/en/collections/16289012-adapting-your-training), [Training plans](https://www.runna.com/training/training-plans)
- TrainingPeaks — [Is Premium worth it? (Peak Performances, athlete analytics, HRV)](https://www.trainingpeaks.com/blog/is-trainingpeaks-premium-worth-it/), [Pricing 2026](https://www.trainingpeaks.com/blog/trainingpeaks-pricing/)
- Stryd — [Race Power Calculator](https://help.stryd.com/en/articles/6879547-race-power-calculator), [Race Calculations FAQ (fatigue factor, 90-day model)](https://help.stryd.com/en/articles/8955821-stryd-race-calculations-faq), [Event Planner (conditions: elevation, temperature, humidity, altitude)](https://support.stryd.com/hc/en-us/articles/360049511054-Race-Power-Calculator-and-Event-Planner)
- Intervals.icu — [Wellness integration (subjective scales)](https://www.intervals.icu/features/wellness/), [Power curve (season comparison)](https://www.intervals.icu/features/power-curve/), [Fitness/Fatigue/Form chart](https://www.intervals.icu/features/fitness-chart/)
- AI-native coaches — [Best AI running coach apps 2026 (Coach Leo, HumanGO, injury-pattern flags)](https://therunninggenie.com/blog/best-ai-running-coach-apps), [Coach Leo](https://coachleo.ai/best-ai-running-coach), [HumanGO / "Hugo"](https://humango.ai/)
