# P1-2 Workout Adherence — Implementation Plan

## Goal
Compare a completed activity to its linked GarminCalendarEvent workout (planned vs actual distance, pace, intervals). Show an adherence summary on Activity Detail and include it in AI analysis context.

## Checklist

- [ ] Create `app/adherence.py`
  - Move step-parsing helpers from `api.py`: `_format_step_distance`, `_format_step_duration`, `_format_pace`, `_garmin_str`, `_parse_step_target`, `_classify_activity_type`, `_parse_single_step`, `_parse_workout_steps`
  - Add adherence logic: `_flatten_steps`, `_parse_pace_display`, `_parse_single_pace`, `compute_adherence`, `format_adherence_context`

- [ ] Update `app/schemas.py`
  - Add `WorkoutAdherence` model
  - Add `adherence: WorkoutAdherence | None = None` to `ActivityDetail`

- [ ] Update `app/api.py`
  - Remove moved functions (lines ~615–801)
  - Import replacements from `app.adherence`
  - Import `WorkoutAdherence` from schemas
  - Call `compute_adherence()` in `api_activity_detail()` when scheduled workout exists

- [ ] Update `app/ai_coach.py`
  - Import from `app.adherence`
  - In `analyze_activity()`: query scheduled workout, compute adherence, append adherence context

- [ ] Update `frontend/src/api/types.ts`
  - Add `WorkoutAdherence` interface
  - Add `adherence: WorkoutAdherence | null` to `ActivityDetail`

- [ ] Create `frontend/src/components/activity-detail/AdherenceCard.tsx`
  - Show adherence score, planned vs actual distance, planned vs actual pace, interval count

- [ ] Create `frontend/src/components/activity-detail/AdherenceCard.css`

- [ ] Update `frontend/src/components/activity-detail/ActivityDetailView.tsx`
  - Import and render `AdherenceCard` when `activity.adherence` is present

## Review
(to be filled after implementation)
