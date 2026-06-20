import { IntervalAdherence, WorkoutAdherence } from '../../api/types'
import './AdherenceCard.css'

interface Props {
  adherence: WorkoutAdherence
}

function formatDistance(meters: number | null): string {
  if (meters === null) return '—'
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${Math.round(meters)} m`
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
                {((adherence.actual_distance_m ?? 0) / 1000).toFixed(2)} km
                {adherence.actual_rest_distance_m
                  ? ` (+${Math.round(adherence.actual_rest_distance_m)} m rest)`
                  : ''} actual
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

      {adherence.intervals && adherence.intervals.length > 0 && (
        <div className="adherence-intervals">
          <div className="adherence-intervals-title">Per-interval breakdown</div>
          <div className="adherence-interval-list">
            {adherence.intervals.map((iv: IntervalAdherence) => (
              <div key={iv.step_order} className="adherence-interval-row">
                <span className="adherence-interval-label">{iv.label}</span>
                {iv.matched ? (
                  <div className="adherence-interval-values">
                    <span className="adherence-interval-dist">
                      {formatDistance(iv.actual_distance_m)}
                      {iv.planned_distance_m !== null && (
                        <span className="adherence-planned">
                          {' / '}{formatDistance(iv.planned_distance_m)}
                        </span>
                      )}
                    </span>
                    {iv.actual_pace_display && (
                      <span className="adherence-interval-pace">{iv.actual_pace_display}</span>
                    )}
                    {iv.pace_delta_sec_per_km !== null && (
                      <span
                        className={`adherence-delta ${iv.pace_delta_sec_per_km <= 0 ? 'adherence-delta-faster' : 'adherence-delta-slower'}`}
                      >
                        {iv.pace_delta_sec_per_km <= 0 ? '-' : '+'}
                        {Math.abs(iv.pace_delta_sec_per_km).toFixed(0)}s
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="adherence-interval-missed">missed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="adherence-bar-container">
        <div
          className="adherence-bar-fill"
          style={{ width: `${adherence.adherence_score}%`, background: color }}
        />
      </div>
    </div>
  )
}
