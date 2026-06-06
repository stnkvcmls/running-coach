# P0-1 · Athlete Profile

## Backend
- [x] `app/models.py` — add `AthleteProfile` model
- [x] `app/utils.py` — add `calculate_age(dob)` helper
- [x] `app/schemas.py` — `AthleteProfileRequest` / `AthleteProfileResponse`
- [x] `app/api.py` — GET/POST `/athlete-profile` (upsert)
- [x] `app/ai_coach.py` — `_format_athlete_profile_context` + inject into `_build_context`

## Frontend
- [x] `api/types.ts` — `AthleteProfile` + `AthleteProfileRequest`
- [x] `api/hooks.ts` — `useAthleteProfile` + `useUpdateAthleteProfile`
- [x] `components/profile/ProfileForm.tsx` (+ css) — shared form
- [x] `components/onboarding/OnboardingView.tsx` (+ css)
- [x] `components/settings/AthleteProfileSection.tsx` wired into SettingsView
- [x] `App.tsx` — `/onboarding` route, chrome-less, first-run redirect

## Tests (backend pytest only)
- [x] `requirements-dev.txt`, `tests/conftest.py`
- [x] `tests/test_athlete_profile.py` (4 tests)
- [x] `tests/test_ai_context.py` (2 tests)

## Verification
- [x] `pytest -q` → 6 passed
- [x] `tsc --noEmit` clean + `npm run build` succeeds

## Review

Implemented P0-1 (Athlete Profile) end-to-end and only within scope.

**Backend:** New singleton `AthleteProfile` table (auto-created by
`Base.metadata.create_all`; no migration helper needed). `age` is derived from
`date_of_birth` via a shared `calculate_age()` in `app/utils.py`, reused by both
the API response and the AI context builder. `GET /api/v1/athlete-profile`
returns `null` (200) when no profile exists so the frontend can detect first-run;
`POST` upserts via `model_dump(exclude_unset=True)` so partial updates preserve
existing fields. `_build_context` now inserts an `## Athlete Profile` section
right after `## Current Data`, emitting only populated fields.

**Frontend:** Shared `ProfileForm` powers both the dedicated chrome-less
`/onboarding` route (with a Skip option) and an editable section in Settings.
`App.tsx` redirects to `/onboarding` on first run when the profile is `null`.

**Tests:** 6 backend pytest tests cover the null/create/update/partial API paths,
computed age, and the AI-context injection (present + absent). All green.

**Notes / out of scope:** Frontend Vitest harness left for P3-2 (per decision).
A broken system `cryptography` rust binding (pulled in via `google.generativeai`)
panicked on import in this container; fixed by `pip install --upgrade cryptography`
— an environment fix, not a code change. The pre-existing Pydantic class-based
`Config` deprecation warnings were left untouched to stay in scope.

---

# Follow-up · Import profile from Garmin (suggest-and-confirm)

Decision: pull Garmin-known physiology and offer it as a one-click "Import from
Garmin" suggestion in the profile form. Nothing persists until the user hits Save
(no auto-overwrite scheduler).

- [x] `app/garmin_sync.py` — `_map_profile_suggestions()` (pure mapping) +
      `fetch_profile_suggestions()` (live calls: `get_full_name`,
      `get_userprofile_settings`, latest `DailySummary.resting_hr`)
- [x] `app/schemas.py` — `GarminProfileSuggestion`
- [x] `app/api.py` — `GET /athlete-profile/garmin-suggestions` (502 on Garmin failure)
- [x] `frontend/src/api/types.ts` + `hooks.ts` — type + `useGarminProfileSuggestions`
- [x] `frontend/src/components/profile/ProfileForm.tsx` — "Import from Garmin" button
- [x] `tests/test_garmin_suggestions.py` — mapping conversions (grams→kg, m/s→pace, omit missing)

### Review
Implemented suggest-and-confirm Garmin import. An "Import from Garmin" button in
the shared `ProfileForm` calls `GET /athlete-profile/garmin-suggestions`, which
pulls name, DOB, weight, threshold pace/HR, max HR (from `get_userprofile_settings`)
and resting HR (latest synced `DailySummary`). Returned values prefill the form
only — nothing persists until the user hits Save. The mapping is a pure function
(`_map_profile_suggestions`, unit-tested for unit conversions and omission of
missing/zero fields). Made the `garminconnect` import lazy in `garmin_sync.py`
(its top-level `withings_sync` import is fragile) so the module's pure helpers are
importable/testable without the SDK. `pytest` → 9 passed; `tsc`/`build` clean.


