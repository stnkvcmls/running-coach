import type { CSSProperties } from 'react'
import type { WorkoutAdherence } from '../../api/types'
import { formatPaceSec } from '../../utils/sessionNotation'
import './RepChart.css'

export interface RepPoint {
  /** Actual pace, seconds per km. */
  paceSec: number
  /** Target pace for the rep (seconds per km), when the plan had one. */
  targetSec: number | null
}

/** Mean of every m:ss pace in a display string ("3:55 - 4:05/km" → 240). */
function meanPace(display: string | null): number | null {
  if (!display) return null
  const paces = Array.from(display.matchAll(/(\d{1,2}):(\d{2})/g), m => Number(m[1]) * 60 + Number(m[2]))
  return paces.length > 0 ? paces.reduce((a, b) => a + b, 0) / paces.length : null
}

/** Work reps from an activity's per-interval adherence breakdown. Returns
 * fewer than two points for an unstructured session — callers hide the chart. */
export function repsFromAdherence(adherence: WorkoutAdherence | null | undefined): RepPoint[] {
  if (!adherence?.intervals) return []
  return adherence.intervals
    .filter(iv => iv.step_type === 'interval' && iv.matched)
    .map(iv => ({ paceSec: meanPace(iv.actual_pace_display), targetSec: meanPace(iv.planned_pace_display) }))
    .filter((r): r is RepPoint => r.paceSec != null)
}

interface Props {
  reps: RepPoint[]
  /** Effort colour of the session (a var(--color-*) reference). */
  color: string
}

/** One bar per work rep — taller is faster — against a dashed target line.
 * Shared by Today's done-state hero and (later) the run analysis. */
export default function RepChart({ reps, color }: Props) {
  if (reps.length < 2) return null
  const targets = reps.map(r => r.targetSec).filter((t): t is number => t != null)
  const target = targets.length > 0 ? targets.reduce((a, b) => a + b, 0) / targets.length : null
  const all = [...reps.map(r => r.paceSec), ...(target != null ? [target] : [])]
  const fastest = Math.min(...all) - 3
  const slowest = Math.max(...all) + 3
  // Faster (smaller) pace → taller bar; the slowest rep still gets a visible bar.
  const height = (pace: number) => 20 + 80 * ((slowest - pace) / (slowest - fastest))
  const labels = reps.map(r => formatPaceSec(r.paceSec))
  const ariaLabel = target != null
    ? `Rep paces against a ${formatPaceSec(target)} target: ${labels.join(', ')}`
    : `Rep paces: ${labels.join(', ')}`

  return (
    <figure className="rep-chart" style={{ '--reps': reps.length } as CSSProperties}>
      <div className="rep-chart-bars" role="img" aria-label={ariaLabel}>
        {reps.map((r, i) => (
          <span key={i} className="rep-chart-bar" style={{ height: `${height(r.paceSec)}%`, background: color }} />
        ))}
        {target != null && (
          <span className="rep-chart-target" style={{ bottom: `${height(target)}%` }}>
            <span>Target {formatPaceSec(target)}</span>
          </span>
        )}
      </div>
      <div className="rep-chart-labels num" aria-hidden="true">
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </figure>
  )
}
