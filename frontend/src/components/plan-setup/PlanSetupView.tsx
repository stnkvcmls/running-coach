import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, RefreshCw } from 'lucide-react'
import { useAthleteProfile, useUpdateAthleteProfile, useGenerateTrainingPlan } from '../../api/hooks'
import TrainingVolumeSheet from './sheets/TrainingVolumeSheet'
import DifficultySheet from './sheets/DifficultySheet'
import RunningAbilitySheet from './sheets/RunningAbilitySheet'
import ElevationSheet from './sheets/ElevationSheet'
import MileageSheet from './sheets/MileageSheet'
import ScheduleSheet from './sheets/ScheduleSheet'
import RaceTimesSheet from './sheets/RaceTimesSheet'
import './PlanSetupView.css'

type SheetId = 'volume' | 'difficulty' | 'ability' | 'elevation' | 'mileage' | 'schedule' | 'racetimes' | null

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try { return JSON.parse(s) } catch { return fallback }
}

export default function PlanSetupView() {
  const { data: profile, isLoading } = useAthleteProfile()
  const { mutate: update } = useUpdateAthleteProfile()
  const { mutate: generatePlan, isPending: isGenerating } = useGenerateTrainingPlan()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<SheetId>(null)

  if (isLoading) return <div className="spinner" />

  const p = profile

  const availDays: string[] = parseJson(p?.available_days, [])
  const raceTimes: Record<string, string> = parseJson(p?.race_times_json, {})

  function describeRaceTimes() {
    const entries = Object.entries(raceTimes).filter(([, v]) => v)
    if (entries.length === 0) return 'Not set'
    return entries.map(([k, v]) => `${cap(k.replace('_', ' '))}: ${v}`).join(', ')
  }

  function describeAvailDays() {
    if (availDays.length === 0) return 'Not set'
    return availDays.join(', ')
  }

  return (
    <div className="psu-view">
      <div className="psu-header">
        <h1 className="psu-title">Training Preferences</h1>
        <p className="psu-subtitle">Choose how much your training ramps up, and how difficult your hard runs feel.</p>
      </div>

      <div className="psu-section">
        <Row label="Training Volume" value={cap(p?.training_volume ?? '') || 'Not set'} onClick={() => setSheet('volume')} />
        <Row label="Difficulty" value={cap(p?.difficulty ?? '') || 'Not set'} onClick={() => setSheet('difficulty')} />
        <Row label="Total Weekly Mileage" value={p?.target_weekly_km != null ? `${p.target_weekly_km} km` : 'Not set'} onClick={() => setSheet('mileage')} />
        <Row label="Current Weekly Mileage" value={p?.weekly_mileage_km != null ? `${p.weekly_mileage_km} km` : 'Not set'} onClick={() => setSheet('mileage')} />
        <Row label="Current Longest Run" value={p?.longest_run_km != null ? `${p.longest_run_km} km` : 'Not set'} onClick={() => setSheet('mileage')} />
      </div>

      <div className="psu-section">
        <div className="psu-section-label">Current Race Times</div>
        <div className="psu-subtitle-sm">Include a shorter and longer distance time for more accurate paces.</div>
        <Row label="Race Times" value={describeRaceTimes()} onClick={() => setSheet('racetimes')} />
      </div>

      <div className="psu-section">
        <div className="psu-section-label">Plan Overview</div>
        <Row label="Running Ability" value={cap(p?.running_ability ?? '') || 'Not set'} onClick={() => setSheet('ability')} />
        <Row label="Elevation Profile" value={cap(p?.elevation_profile ?? '') || 'Not set'} onClick={() => setSheet('elevation')} />
      </div>

      <div className="psu-section">
        <div className="psu-section-label">Running Schedule</div>
        <Row label="Runs Per Week" value={p?.runs_per_week != null ? String(p.runs_per_week) : 'Not set'} onClick={() => setSheet('schedule')} />
        <Row label="Available Days" value={describeAvailDays()} onClick={() => setSheet('schedule')} />
        <Row label="Long Run Day" value={p?.long_run_day ?? 'Not set'} onClick={() => setSheet('schedule')} />
      </div>

      <button
        className="psu-regen-btn"
        onClick={() => generatePlan(undefined, { onSuccess: () => navigate('/plan') })}
        disabled={isGenerating}
      >
        {isGenerating ? <RefreshCw size={16} className="psu-spin" /> : null}
        {isGenerating ? 'Generating…' : 'Save & Regenerate Plan'}
      </button>

      {/* Sheets */}
      <TrainingVolumeSheet
        open={sheet === 'volume'}
        onClose={() => setSheet(null)}
        initial={p?.training_volume ?? null}
        onSave={v => update({ training_volume: v })}
      />
      <DifficultySheet
        open={sheet === 'difficulty'}
        onClose={() => setSheet(null)}
        initial={p?.difficulty ?? null}
        onSave={v => update({ difficulty: v })}
      />
      <RunningAbilitySheet
        open={sheet === 'ability'}
        onClose={() => setSheet(null)}
        initial={p?.running_ability ?? null}
        onSave={v => update({ running_ability: v })}
      />
      <ElevationSheet
        open={sheet === 'elevation'}
        onClose={() => setSheet(null)}
        initial={p?.elevation_profile ?? null}
        onSave={v => update({ elevation_profile: v })}
      />
      <MileageSheet
        open={sheet === 'mileage'}
        onClose={() => setSheet(null)}
        initialWeekly={p?.weekly_mileage_km ?? null}
        initialLongest={p?.longest_run_km ?? null}
        initialTarget={p?.target_weekly_km ?? null}
        onSave={(weekly, longest, target) => update({ weekly_mileage_km: weekly, longest_run_km: longest, target_weekly_km: target })}
      />
      <ScheduleSheet
        open={sheet === 'schedule'}
        onClose={() => setSheet(null)}
        initialRunsPerWeek={p?.runs_per_week ?? null}
        initialAvailableDays={availDays}
        initialLongRunDay={p?.long_run_day ?? null}
        onSave={(rpw, days, lrd) => update({ runs_per_week: rpw, available_days: JSON.stringify(days), long_run_day: lrd })}
      />
      <RaceTimesSheet
        open={sheet === 'racetimes'}
        onClose={() => setSheet(null)}
        initial={raceTimes}
        onSave={times => update({ race_times_json: JSON.stringify(times) })}
      />
    </div>
  )
}

function Row({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button className="psu-row" onClick={onClick}>
      <div className="psu-row-content">
        <span className="psu-row-label">{label}</span>
        <span className="psu-row-value">{value}</span>
      </div>
      <ChevronRight size={18} className="psu-row-chevron" />
    </button>
  )
}
