import { useState } from 'react'
import type { AthleteProfile, AthleteProfileRequest } from '../../api/types'
import './ProfileForm.css'

interface ProfileFormProps {
  initial?: AthleteProfile | null
  onSubmit: (data: AthleteProfileRequest) => void
  isPending?: boolean
  isError?: boolean
  submitLabel?: string
}

interface FormState {
  name: string
  date_of_birth: string
  weight_kg: string
  goal_race: string
  goal_race_date: string
  threshold_pace_min_km: string
  threshold_hr: string
  threshold_power: string
  max_hr: string
  resting_hr: string
  injury_history: string
  weekly_availability: string
  training_preferences: string
}

function toFormState(p?: AthleteProfile | null): FormState {
  const s = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v))
  return {
    name: s(p?.name),
    date_of_birth: s(p?.date_of_birth),
    weight_kg: s(p?.weight_kg),
    goal_race: s(p?.goal_race),
    goal_race_date: s(p?.goal_race_date),
    threshold_pace_min_km: s(p?.threshold_pace_min_km),
    threshold_hr: s(p?.threshold_hr),
    threshold_power: s(p?.threshold_power),
    max_hr: s(p?.max_hr),
    resting_hr: s(p?.resting_hr),
    injury_history: s(p?.injury_history),
    weekly_availability: s(p?.weekly_availability),
    training_preferences: s(p?.training_preferences),
  }
}

const text = (v: string) => (v.trim() === '' ? null : v.trim())
const num = (v: string) => (v.trim() === '' ? null : Number(v))

function toRequest(f: FormState): AthleteProfileRequest {
  return {
    name: text(f.name),
    date_of_birth: text(f.date_of_birth),
    weight_kg: num(f.weight_kg),
    goal_race: text(f.goal_race),
    goal_race_date: text(f.goal_race_date),
    threshold_pace_min_km: num(f.threshold_pace_min_km),
    threshold_hr: num(f.threshold_hr),
    threshold_power: num(f.threshold_power),
    max_hr: num(f.max_hr),
    resting_hr: num(f.resting_hr),
    injury_history: text(f.injury_history),
    weekly_availability: text(f.weekly_availability),
    training_preferences: text(f.training_preferences),
  }
}

export default function ProfileForm({ initial, onSubmit, isPending, isError, submitLabel = 'Save' }: ProfileFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial))

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(toRequest(form))
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="profile-form__field">
        <label htmlFor="pf-name">Name</label>
        <input id="pf-name" type="text" value={form.name} disabled readOnly />
        <span className="profile-form__hint">Synced from Garmin</span>
      </div>

      <div className="profile-form__row">
        <div className="profile-form__field">
          <label htmlFor="pf-dob">Date of birth</label>
          <input id="pf-dob" type="date" value={form.date_of_birth} disabled readOnly />
          <span className="profile-form__hint">Synced from Garmin</span>
        </div>
        <div className="profile-form__field">
          <label htmlFor="pf-weight">Weight (kg)</label>
          <input id="pf-weight" type="number" step="0.1" min="0" value={form.weight_kg} disabled readOnly />
          <span className="profile-form__hint">Synced from Garmin</span>
        </div>
      </div>

      <div className="profile-form__row">
        <div className="profile-form__field">
          <label htmlFor="pf-goal">Goal race</label>
          <input id="pf-goal" type="text" placeholder="e.g. Berlin Marathon" value={form.goal_race} onChange={set('goal_race')} />
        </div>
        <div className="profile-form__field">
          <label htmlFor="pf-goal-date">Goal race date</label>
          <input id="pf-goal-date" type="date" value={form.goal_race_date} onChange={set('goal_race_date')} />
        </div>
      </div>

      <div className="profile-form__row">
        <div className="profile-form__field">
          <label htmlFor="pf-pace">Threshold pace (min/km)</label>
          <input id="pf-pace" type="number" step="0.01" min="0" value={form.threshold_pace_min_km} onChange={set('threshold_pace_min_km')} />
        </div>
        <div className="profile-form__field">
          <label htmlFor="pf-thr-hr">Threshold HR (bpm)</label>
          <input id="pf-thr-hr" type="number" min="0" value={form.threshold_hr} onChange={set('threshold_hr')} />
        </div>
      </div>

      <div className="profile-form__row">
        <div className="profile-form__field">
          <label htmlFor="pf-ftp">FTP / Threshold power (W)</label>
          <input id="pf-ftp" type="number" min="0" value={form.threshold_power} onChange={set('threshold_power')} />
        </div>
      </div>

      <div className="profile-form__row">
        <div className="profile-form__field">
          <label htmlFor="pf-max-hr">Max HR (bpm)</label>
          <input id="pf-max-hr" type="number" min="0" value={form.max_hr} onChange={set('max_hr')} />
        </div>
        <div className="profile-form__field">
          <label htmlFor="pf-rest-hr">Resting HR (bpm)</label>
          <input id="pf-rest-hr" type="number" min="0" value={form.resting_hr} onChange={set('resting_hr')} />
        </div>
      </div>

      <div className="profile-form__field">
        <label htmlFor="pf-avail">Weekly availability</label>
        <textarea id="pf-avail" rows={2} placeholder="e.g. 5 days/week, long run Sunday" value={form.weekly_availability} onChange={set('weekly_availability')} />
      </div>

      <div className="profile-form__field">
        <label htmlFor="pf-prefs">Training preferences</label>
        <textarea id="pf-prefs" rows={2} placeholder="e.g. prefer trails, 2 hard sessions/week" value={form.training_preferences} onChange={set('training_preferences')} />
      </div>

      <div className="profile-form__field">
        <label htmlFor="pf-injury">Injury history</label>
        <textarea id="pf-injury" rows={2} placeholder="e.g. left Achilles tendinopathy (2024)" value={form.injury_history} onChange={set('injury_history')} />
      </div>

      {isError && <span className="profile-form__error">Failed to save profile</span>}

      <button className="profile-form__submit" type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
