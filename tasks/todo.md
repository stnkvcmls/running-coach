# Pull Name, DOB, Weight from Garmin — Implementation Plan

## Goal
Always source the athlete's Name, Date of birth, and Weight from Garmin (read-only),
and disable those three fields in the Athlete Profile form.

## Checklist

### Backend
- [ ] `app/garmin_sync.py`: import `AthleteProfile`
- [ ] `app/garmin_sync.py`: add `_fetch_garmin_profile_fields()` (name via get_full_name,
      DOB + weight via get_user_profile().userData, weight fallback via body composition)
- [ ] `app/garmin_sync.py`: add `sync_athlete_profile()` upsert + sync status
- [ ] `app/main.py`: call `sync_athlete_profile()` on backfill startup and in daily sync
- [ ] `app/api.py`: strip Garmin-managed fields (name/dob/weight) from the POST so the
      user can never override them

### Frontend
- [ ] `frontend/src/components/profile/ProfileForm.tsx`: disable Name, DOB, Weight inputs,
      add "Synced from Garmin" hint

### Verify
- [ ] Backend unit tests for the new extraction + sync
- [ ] Run pytest, run frontend build/typecheck

## Review

All checklist items complete.

### What was implemented
**Backend**
- `app/garmin_sync.py`: `sync_athlete_profile()` pulls name (`get_full_name`), date of
  birth and weight from Garmin user settings (`get_user_profile().userData`), with a
  body-composition fallback for weight. Upserts the singleton `AthleteProfile`,
  always overwriting the three Garmin-managed fields; records `last_profile_sync`.
- `app/main.py`: profile sync runs on startup backfill and in the daily scheduled sync.
- `app/api.py`: `POST /athlete-profile` strips `name`/`date_of_birth`/`weight_kg` so the
  client can never override Garmin-sourced values (authoritative server-side).

**Frontend**
- `ProfileForm.tsx`: Name, Date of birth and Weight inputs are `disabled`/`readOnly`
  with a "Synced from Garmin" hint; remaining fields stay editable.

### Verification
- Backend: full suite passes (301 tests), coverage 88% (CI gate 80%). New tests cover
  field extraction, weight fallback, missing-data tolerance, profile upsert/overwrite,
  and the API ignoring Garmin-managed fields. Updated existing athlete-profile API tests
  to reflect the new read-only behavior.
- Frontend: `tsc --noEmit` clean; vitest 50 tests pass.

### Local env note
`garminconnect==0.2.25` pulls `withings_sync`, whose wheel won't build on this box's
setuptools (CI on py3.11 is fine). Installed garminconnect with `--no-deps` and added a
tiny local `withings_sync.fit` stub purely to run tests; `fit` is only used by
`add_body_composition`, which this change never calls.
