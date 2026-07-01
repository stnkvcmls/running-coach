import { useState } from 'react'
import { Watch, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useRacePacing, usePushRacePacing } from '../../api/hooks'
import { formatDuration } from '../../utils/formatting'
import type { RaceInfo } from '../../api/types'
import './RacePacingCard.css'

function formatPace(paceMinKm: number): string {
  const mins = Math.floor(paceMinKm)
  const secs = Math.round((paceMinKm - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')}/km`
}

function formatSplitDist(distM: number, splitUnit: string): string {
  if (splitUnit === 'mile') {
    return `${(distM / 1609.344).toFixed(2)} mi`
  }
  return distM >= 950 ? `${(distM / 1000).toFixed(0)} km` : `${Math.round(distM)} m`
}

function formatGrade(gradePct: number): string {
  const sign = gradePct > 0 ? '+' : ''
  return `${sign}${gradePct.toFixed(1)}%`
}

interface Props {
  race: RaceInfo
}

export default function RacePacingCard({ race }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [strategy, setStrategy] = useState<'even' | 'negative_split' | 'terrain'>('even')
  const [splitUnit] = useState<'km' | 'mile'>('km')
  const [pushed, setPushed] = useState(false)

  const { data: plan, isLoading, isError, error } = useRacePacing(race.id, {
    strategy,
    splitUnit,
  })

  const { mutate: pushToGarmin, isPending: isPushing } = usePushRacePacing()

  const handlePush = () => {
    pushToGarmin(
      { raceId: race.id, body: { strategy, split_unit: splitUnit } },
      { onSuccess: () => setPushed(true) },
    )
  }

  return (
    <div className="race-pacing-card">
      <button
        className="race-pacing-toggle"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <span className="race-pacing-toggle-label">Pacing Strategy</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="race-pacing-body">
          <div className="race-pacing-controls">
            <div className="race-pacing-strategy-group">
              <button
                className={`race-pacing-strategy-btn${strategy === 'even' ? ' active' : ''}`}
                onClick={() => setStrategy('even')}
              >
                Even
              </button>
              <button
                className={`race-pacing-strategy-btn${strategy === 'negative_split' ? ' active' : ''}`}
                onClick={() => setStrategy('negative_split')}
              >
                Negative Split
              </button>
              <button
                className={`race-pacing-strategy-btn${strategy === 'terrain' ? ' active' : ''}`}
                onClick={() => setStrategy('terrain')}
              >
                Terrain
              </button>
            </div>
          </div>

          {isLoading && <div className="race-pacing-loading">Loading splits…</div>}
          {isError && (
            <div className="race-pacing-error">
              {error instanceof Error && error.message
                ? error.message
                : 'Unable to generate pacing plan. Set a goal time or sync more runs to build a fitness model.'}
            </div>
          )}

          {plan && (
            <>
              <div className="race-pacing-summary">
                <span className="race-pacing-stat">
                  <span className="race-pacing-stat-label">Target</span>
                  <span className="race-pacing-stat-value">{formatDuration(plan.target_time_sec)}</span>
                </span>
                <span className="race-pacing-stat">
                  <span className="race-pacing-stat-label">Avg Pace</span>
                  <span className="race-pacing-stat-value">{formatPace(plan.target_pace_min_km)}</span>
                </span>
                {plan.predicted_time_sec != null && (
                  <span className="race-pacing-stat">
                    <span className="race-pacing-stat-label">Predicted</span>
                    <span className="race-pacing-stat-value">{formatDuration(plan.predicted_time_sec)}</span>
                  </span>
                )}
                <span className="race-pacing-stat race-pacing-source">
                  <span className="race-pacing-stat-label">Based on</span>
                  <span className="race-pacing-stat-value">
                    {plan.source === 'goal' ? 'goal time' : plan.source === 'predicted' ? 'fitness model' : 'custom'}
                  </span>
                </span>
              </div>

              {strategy === 'terrain' && plan.course_activity_name && (
                <div className="race-pacing-course-note">
                  Course profile from "{plan.course_activity_name}" — effort held constant over the grade.
                </div>
              )}

              <div className="race-pacing-table-wrap">
                <table className="race-pacing-table">
                  <thead>
                    <tr>
                      <th>Split</th>
                      <th>Dist</th>
                      {strategy === 'terrain' && <th>Grade</th>}
                      <th>Pace</th>
                      <th>Time</th>
                      <th>Cumul.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.splits.map(s => (
                      <tr key={s.split_number}>
                        <td>{s.split_number}</td>
                        <td>{formatSplitDist(s.split_distance_m, plan.split_unit)}</td>
                        {strategy === 'terrain' && (
                          <td className="race-pacing-grade">
                            {s.grade_pct != null ? formatGrade(s.grade_pct) : '—'}
                          </td>
                        )}
                        <td className="race-pacing-pace">{formatPace(s.target_pace_min_km)}</td>
                        <td>{formatDuration(s.split_time_sec)}</td>
                        <td className="race-pacing-cumul">{formatDuration(s.cumulative_time_sec)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                className="race-pacing-push-btn"
                onClick={handlePush}
                disabled={isPushing || pushed}
              >
                {isPushing ? (
                  <RefreshCw size={13} className="spin" />
                ) : (
                  <Watch size={13} />
                )}
                {pushed ? 'Sent to watch' : 'Send to watch'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
