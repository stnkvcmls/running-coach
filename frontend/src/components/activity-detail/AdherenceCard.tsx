import { WorkoutAdherence } from '../../api/types'
import './AdherenceCard.css'

interface Props {
  adherence: WorkoutAdherence
}

function scoreColor(score: number): string {
  if (score >= 90) return '#10b981'  // green
  if (score >= 70) return '#f59e0b'  // amber
  return '#ef4444'                    // red
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 55) return 'Fair'
  return 'Low'
}

export default function AdherenceCard({ adherence }: Props) {
  const color = scoreColor(adherence.adherence_score)
  const label = scoreLabel(adherence.adherence_score)

  const hasPaceComparison =
    adherence.planned_pace_display && adherence.actual_pace_display

  const hasDistanceComparison =
    adherence.planned_distance_m !== null && adherence.actual_distance_m !== null

  const hasIntervalComparison =
    adherence.planned_intervals !== null && adherence.actual_laps !== null

  return (
    <div className="card adherence-card">
      <div className="adherence-header">
        <span className="adherence-title">Workout Adherence</span>
        <span className="adherence-score-badge">
          <span className="adherence-score-value" style={{ color }}>{adherence.adherence_score.toFixed(0)}</span>
          <span style={{ color, fontSize: '0.8rem' }}>{label}</span>
        </span>
      </div>

      <p className="adherence-summary">{adherence.summary}</p>

      <div className="adherence-rows">
        {hasDistanceComparison && (
          <div className="adherence-row">
            <span className="adherence-row-label">Distance</span>
            <div className="adherence-row-values">
              <span className="adherence-planned">
                {((adherence.planned_distance_m ?? 0) / 1000).toFixed(2)} km planned
              </span>
              <span className="adherence-actual">
                {((adherence.actual_distance_m ?? 0) / 1000).toFixed(2)} km actual
              </span>
              {adherence.distance_pct !== null && (
                <span
                  className={`adherence-delta ${adherence.distance_pct >= 95 ? 'adherence-delta-faster' : 'adherence-delta-slower'}`}
                >
                  {adherence.distance_pct.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        )}

        {hasPaceComparison && (
          <div className="adherence-row">
            <span className="adherence-row-label">Pace</span>
            <div className="adherence-row-values">
              <span className="adherence-planned">{adherence.planned_pace_display} planned</span>
              <span className="adherence-actual">{adherence.actual_pace_display} actual</span>
              {adherence.pace_delta_sec_per_km !== null && (
                <span
                  className={`adherence-delta ${adherence.pace_delta_sec_per_km <= 0 ? 'adherence-delta-faster' : 'adherence-delta-slower'}`}
                >
                  {Math.abs(adherence.pace_delta_sec_per_km).toFixed(0)}s
                  {adherence.pace_delta_sec_per_km <= 0 ? ' faster' : ' slower'}
                </span>
              )}
            </div>
          </div>
        )}

        {hasIntervalComparison && (
          <div className="adherence-row">
            <span className="adherence-row-label">Intervals</span>
            <div className="adherence-row-values">
              <span className="adherence-planned">{adherence.planned_intervals} planned</span>
              <span className="adherence-actual">{adherence.actual_laps} laps</span>
            </div>
          </div>
        )}
      </div>

      <div className="adherence-bar-container">
        <div
          className="adherence-bar-fill"
          style={{ width: `${adherence.adherence_score}%`, background: color }}
        />
      </div>
    </div>
  )
}
