import { Flag } from 'lucide-react'
import { useSeasonPlan } from '../../api/hooks'
import './SeasonTimeline.css'

const PHASE_COLORS: Record<string, string> = {
  base: 'var(--color-easy, #4caf50)',
  build: 'var(--color-tempo, #e57373)',
  peak: 'var(--color-interval, #e91e63)',
  taper: 'var(--color-cross, #9b59b6)',
  race: 'var(--accent)',
  recovery: 'var(--color-strength, #9c7fe0)',
}

const PHASE_LABELS: Record<string, string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
  race: 'Race',
  recovery: 'Recovery',
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(fromStr + 'T00:00:00').getTime()
  const to = new Date(toStr + 'T00:00:00').getTime()
  return Math.round((to - from) / 86400000)
}

export default function SeasonTimeline() {
  const { data: plan } = useSeasonPlan()
  if (!plan || plan.weeks.length === 0) return null

  const t = today()
  const daysUntil = daysBetween(t, plan.goal_race_date)
  const phasesPresent = Array.from(new Set(plan.weeks.map(w => w.phase)))

  return (
    <div className="season-timeline">
      <div className="season-timeline-header">
        <Flag size={14} className="season-timeline-icon" />
        <span className="season-timeline-title">
          Season Plan → {plan.goal_race_title || 'Goal Race'}
        </span>
        {daysUntil >= 0 && <span className="season-timeline-days">{daysUntil} days</span>}
      </div>
      <div className="season-timeline-track">
        {plan.weeks.map(w => {
          const weekEnd = addDays(w.week_start, 6)
          const isCurrent = w.week_start <= t && t <= weekEnd
          const title = `Week of ${w.week_start} — ${PHASE_LABELS[w.phase] ?? w.phase}`
            + (w.target_weekly_km != null ? ` · ~${w.target_weekly_km.toFixed(0)} km` : '')
            + (w.notes ? ` — ${w.notes}` : '')
          return (
            <div
              key={w.week_number}
              className={[
                'season-timeline-chip',
                isCurrent ? 'season-timeline-chip--current' : '',
                w.phase === 'race' ? 'season-timeline-chip--race' : '',
              ].filter(Boolean).join(' ')}
              style={{ backgroundColor: PHASE_COLORS[w.phase] ?? 'var(--text-muted)' }}
              title={title}
            />
          )
        })}
      </div>
      <div className="season-timeline-legend">
        {phasesPresent.map(p => (
          <span key={p} className="season-timeline-legend-item">
            <span
              className="season-timeline-legend-dot"
              style={{ backgroundColor: PHASE_COLORS[p] ?? 'var(--text-muted)' }}
            />
            {PHASE_LABELS[p] ?? p}
          </span>
        ))}
      </div>
    </div>
  )
}
