import { useSeasonPlan } from '../../api/hooks'
import type { SeasonPlanWeek } from '../../api/types'
import { todayStr } from '../../utils/planDayState'
import { formatDateKey } from '../../utils/date'
import './SeasonTimeline.css'

const PHASE_LABELS: Record<string, string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
  race: 'Race',
  recovery: 'Recovery',
}

export function phaseLabel(phase: string): string {
  return PHASE_LABELS[phase] ?? phase.charAt(0).toUpperCase() + phase.slice(1)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  // Local date key, not toISOString() (UTC) — see tasks/lessons.md.
  return formatDateKey(d)
}

interface PhaseRun {
  phase: string
  weeks: number
  /** Index of the run's first week in the season. */
  start: number
}

/** Consecutive weeks of the same phase collapse into one segment. */
function phaseRuns(weeks: SeasonPlanWeek[]): PhaseRun[] {
  const runs: PhaseRun[] = []
  weeks.forEach((w, i) => {
    const last = runs[runs.length - 1]
    if (last && last.phase === w.phase) last.weeks += 1
    else runs.push({ phase: w.phase, weeks: 1, start: i })
  })
  return runs
}

/**
 * Season ribbon (§4.3 P7): phase is a position in time, so the ribbon is
 * monochrome — past phases ink-3, the current one ink, future ones the border
 * tone — with a caret over the current week and the block summary under it.
 */
export default function SeasonTimeline({ summary }: { summary?: string | null }) {
  const { data: plan } = useSeasonPlan()
  const hasSeason = !!plan && plan.weeks.length > 0
  if (!hasSeason && !summary) return null

  let ribbon = null
  if (plan && hasSeason) {
    const t = todayStr()
    const weeks = plan.weeks
    const total = weeks.length
    let currentIdx = weeks.findIndex(w => w.week_start <= t && t <= addDays(w.week_start, 6))
    // Before the season starts nothing is current; after it, everything is past.
    const beforeStart = t < weeks[0].week_start
    if (currentIdx < 0 && !beforeStart) currentIdx = total
    const runs = phaseRuns(weeks)
    const status = (r: PhaseRun) =>
      beforeStart || currentIdx < r.start ? 'future'
        : currentIdx >= r.start + r.weeks ? 'past'
          : 'current'
    const currentRun = runs.find(r => status(r) === 'current')
    const label = runs
      .map(r => `${phaseLabel(r.phase)} ${r.weeks} week${r.weeks !== 1 ? 's' : ''}${status(r) === 'current' ? ', current' : status(r) === 'past' ? ', done' : ''}`)
      .join('; ')

    ribbon = (
      <div className="season-ribbon" role="img" aria-label={`Season: ${label}`}>
        {currentRun && currentIdx < total && (
          <span
            className="season-ribbon-mark"
            data-testid="season-here"
            style={{ left: `${((currentIdx + 0.5) / total) * 100}%` }}
          />
        )}
        <div className="season-ribbon-bar">
          {runs.map(r => (
            <span
              key={r.start}
              className={`season-ribbon-seg season-ribbon-seg--${status(r)}`}
              style={{ flex: r.weeks }}
            />
          ))}
        </div>
        <div className="season-ribbon-labels" aria-hidden="true">
          {runs.map(r => (
            <span
              key={r.start}
              className={status(r) === 'current' ? 'season-ribbon-label--current' : undefined}
              style={{ flex: r.weeks }}
            >
              {/* One-week phases are too narrow for a label unless current. */}
              {r.weeks > 1 || status(r) === 'current' ? phaseLabel(r.phase) : ''}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="season-timeline">
      {ribbon}
      {summary && <p className="season-summary">{summary}</p>}
    </section>
  )
}
