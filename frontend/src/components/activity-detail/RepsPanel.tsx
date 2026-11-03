import { useState } from 'react'
import type { WorkoutAdherence } from '../../api/types'
import RepChart, { repsFromAdherence } from '../ui/RepChart'
import { formatPaceSec } from '../../utils/sessionNotation'
import AdherenceCard from './AdherenceCard'
import { peakIn, repStructureLabel, type StepWindow } from './runAnalysis'

interface Props {
  adherence: WorkoutAdherence
  /** Effort colour of the session. */
  color: string
  /** Heart-rate samples and their distance from the start, for per-rep peaks. */
  hr?: (number | null)[] | null
  distanceKm?: number[] | null
  /** Each adherence step's stretch of the run (same order as `adherence.intervals`). */
  windows?: StepWindow[] | null
}

/** "Did I hit my reps?" (D1, D5): one bar per work rep against the target,
 * with peak HR under each, and the full lap table behind "All laps". */
export default function RepsPanel({ adherence, color, hr, distanceKm, windows }: Props) {
  const [showLaps, setShowLaps] = useState(false)
  const canPeak = !!hr && !!distanceKm && !!windows
  const reps = repsFromAdherence(
    adherence,
    canPeak ? (_step, index) => peakIn(hr!, distanceKm!, windows![index]) : undefined,
  )
  if (reps.length < 2) return null

  const targets = reps.map(r => r.targetSec).filter((t): t is number => t != null)
  const target = targets.length > 0 ? targets.reduce((a, b) => a + b, 0) / targets.length : null
  const hasHr = reps.some(r => r.peakHr != null)
  const summary = [
    repStructureLabel(adherence.intervals ?? []),
    target != null ? `target ${formatPaceSec(target)} /km` : null,
    `${Math.round(adherence.adherence_score)}% adherence`,
  ].filter(Boolean).join(', ')

  return (
    <section className="detail-panel reps-panel">
      <div className="detail-panel-head">
        <h3 className="section-title">Reps</h3>
        <button
          type="button"
          className="detail-panel-link"
          aria-expanded={showLaps}
          onClick={() => setShowLaps(v => !v)}
        >
          {showLaps ? 'Hide laps' : 'All laps'}
        </button>
      </div>
      <p className="reps-summary">{summary}</p>
      <RepChart reps={reps} color={color} />
      <p className="reps-note">
        {hasHr ? 'Pace, with peak HR beneath.' : 'Pace per rep.'} Faster reps are taller.
      </p>
      {showLaps && (
        <div className="reps-laps">
          <AdherenceCard adherence={adherence} />
        </div>
      )}
    </section>
  )
}
