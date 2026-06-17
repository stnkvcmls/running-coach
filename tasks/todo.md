# P1-3 Custom, Threshold-Anchored Zones — Implementation Plan

## Goal
Let the athlete configure HR/pace/power zones anchored to threshold values (from AthleteProfile),
replacing the hardcoded percentile-only bands for those metrics. Use them in the Settings UI, the
AI context, and a new pace zone chart in Activity Detail.

## Checklist

### Backend

- [x] `app/models.py`
  - Add `threshold_power` column to `AthleteProfile`
  - Add new `ZoneConfig` model (zone_type, zone_number, zone_name, zone_color, min_pct, max_pct)

- [x] `app/database.py`
  - Extend `_migrate_db()` to add `threshold_power` to `athlete_profiles`
  - Add `_seed_zone_configs()` with Coggan-style defaults for HR, pace, power
  - Call `_seed_zone_configs()` from `init_db()`

- [x] `app/schemas.py`
  - Add `ZoneConfigResponse`, `ZoneConfigUpdate`, `ZoneConfigBulkUpdate`, `ZoneConfigsResponse`
  - Add `threshold_power` to `AthleteProfileRequest` and `AthleteProfileResponse`

- [x] `app/api.py`
  - Import `ZoneConfig` model, import new zone schemas
  - Add `_compute_zone_bounds()` helper (applies threshold to get absolute values)
  - Add `GET /api/v1/zones` endpoint
  - Add `PUT /api/v1/zones` endpoint

- [x] `app/ai_coach.py`
  - Import `ZoneConfig` model
  - Add `_classify_by_zones(value, configs, threshold)` helper
  - Update `_format_activity_context()` to annotate avg_hr and avg_pace with custom zone labels
  - Update `_format_athlete_profile_context()` to include threshold_power when set
  - Update `_build_context()` (load zone configs via `_load_zone_configs()` helper)

### Frontend

- [x] `frontend/src/api/client.ts` — Add `apiPut<T>` function

- [x] `frontend/src/api/types.ts`
  - Add `ZoneConfig`, `ZoneConfigUpdate`, `ZoneConfigBulkUpdate`, `ZoneConfigsResponse`
  - Add `threshold_power` to `AthleteProfile` and `AthleteProfileRequest`

- [x] `frontend/src/api/hooks.ts`
  - Add `useZoneConfigs()` and `useUpdateZoneConfigs()` hooks

- [x] `frontend/src/components/profile/ProfileForm.tsx`
  - Add `threshold_power` field (FTP in watts)

- [x] `frontend/src/components/settings/ZoneConfigSection.tsx` (new)
  - Zone editor for HR, Pace, Power zones
  - Editable zone names and % boundaries; shows computed absolute values from profile thresholds

- [x] `frontend/src/components/settings/ZoneConfigSection.css` (new)

- [x] `frontend/src/components/settings/SettingsView.tsx`
  - Import and render `<ZoneConfigSection />`

- [x] `frontend/src/components/activity-detail/PaceZonesChart.tsx` (new)
  - Compute time-in-zone from chart_data pace series using custom zone configs
  - Bar chart (matches HrZonesChart style)

- [x] `frontend/src/components/activity-detail/PaceZonesChart.css` (new)

- [x] `frontend/src/components/activity-detail/ActivityDetailView.tsx`
  - Import and render `<PaceZonesChart />` for running activities with pace data

## Review

All 15 checklist items complete. Build passes with no TypeScript errors.

### What was implemented

**Backend:**
- New `ZoneConfig` SQLAlchemy model with 15 seeded default zones (5 each for HR, pace, power)
  using Coggan-style percentages of threshold values
- `threshold_power` (FTP in watts) added to `AthleteProfile` model and migrated into the DB
- New API endpoints `GET /api/v1/zones` and `PUT /api/v1/zones` for reading and editing zones
- `_classify_by_zones()` function in `ai_coach.py` classifies HR and pace values using custom zones
- AI context now annotates `Avg HR` and `Avg Pace` with the zone label when profile thresholds are set

**Frontend:**
- Settings page shows a "Training Zones" section with three zone editors (HR, Pace, Power)
- Each zone shows editable name and % boundaries; computed absolute values appear once profile
  thresholds are set
- `FTP / Threshold power` field added to Athlete Profile form
- New `PaceZonesChart` in Activity Detail computes time in each custom pace zone from chart data
