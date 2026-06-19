import { useThresholdEstimate, useApplyThresholdEstimate } from '../../api/hooks'
import type { ThresholdEstimateField, ThresholdEstimateResponse } from '../../api/types'
import './ThresholdEstimateSection.css'

function formatPace(minPerKm: number): string {
  const min = Math.floor(minPerKm)
  const sec = Math.round((minPerKm - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}/km`
}

interface Row {
  label: string
  field: ThresholdEstimateField
  display: (v: number) => string
  current: number | null
  currentDisplay: (v: number) => string
  extra?: string
}

function ConfidenceBadge({ confidence }: { confidence: string | null }) {
  if (!confidence) return null
  return <span className={`te-conf te-conf--${confidence}`}>{confidence}</span>
}

export default function ThresholdEstimateSection() {
  const { data, isLoading, isError } = useThresholdEstimate()
  const apply = useApplyThresholdEstimate()

  if (isLoading) return null
  if (isError || !data) {
    return (
      <section className="settings-section">
        <h2 className="section-title">Threshold Estimation</h2>
        <div className="card">
          <p className="te-desc">Could not compute threshold estimates.</p>
        </div>
      </section>
    )
  }

  const d: ThresholdEstimateResponse = data

  const rows: Row[] = [
    {
      label: 'Critical Power (≈ FTP)',
      field: d.critical_power,
      display: (v) => `${Math.round(v)} W`,
      current: d.current_threshold_power,
      currentDisplay: (v) => `${Math.round(v)} W`,
      extra: [
        d.w_prime != null ? `W' ${Math.round(d.w_prime)} J` : null,
        d.pmax != null ? `Pmax ${Math.round(d.pmax)} W` : null,
      ].filter(Boolean).join(' · ') || undefined,
    },
    {
      label: 'Threshold Pace',
      field: d.threshold_pace_min_km,
      display: (v) => formatPace(v),
      current: d.current_threshold_pace_min_km,
      currentDisplay: (v) => formatPace(v),
    },
    {
      label: 'Threshold HR (LTHR)',
      field: d.threshold_hr,
      display: (v) => `${Math.round(v)} bpm`,
      current: d.current_threshold_hr,
      currentDisplay: (v) => `${Math.round(v)} bpm`,
    },
    {
      label: 'Max HR (observed)',
      field: d.max_hr,
      display: (v) => `${Math.round(v)} bpm`,
      current: d.current_max_hr,
      currentDisplay: (v) => `${Math.round(v)} bpm`,
    },
  ]

  const hasAnyEstimate = rows.some((r) => r.field.value != null)

  return (
    <section className="settings-section">
      <h2 className="section-title">Threshold Estimation</h2>
      <p className="te-desc">
        Auto-derived from your last {d.lookback_days} days of training
        ({d.activities_analyzed} activities) using a Critical Power / Critical
        Velocity model. Apply these to your profile to drive the threshold-anchored
        training zones — your manual values are never overwritten unless you apply.
      </p>

      <div className="card te-card">
        {!hasAnyEstimate ? (
          <p className="te-empty">
            Not enough recent activity data to estimate thresholds yet. Estimates need
            a spread of efforts across different durations.
          </p>
        ) : (
          <>
            <div className="te-table">
              <div className="te-head">
                <span>Metric</span>
                <span>Estimated</span>
                <span>Current</span>
                <span>Confidence</span>
              </div>
              {rows.map((r) => (
                <div key={r.label} className="te-row">
                  <span className="te-label">
                    {r.label}
                    {r.extra && r.field.value != null && (
                      <span className="te-extra">{r.extra}</span>
                    )}
                  </span>
                  <span className="te-value">
                    {r.field.value != null ? r.display(r.field.value) : '—'}
                  </span>
                  <span className="te-current">
                    {r.current != null ? r.currentDisplay(r.current) : '—'}
                  </span>
                  <span>
                    <ConfidenceBadge confidence={r.field.value != null ? r.field.confidence : null} />
                  </span>
                </div>
              ))}
            </div>

            {rows.some((r) => r.field.value != null && r.field.note) && (
              <ul className="te-notes">
                {rows
                  .filter((r) => r.field.value != null && r.field.note)
                  .map((r) => (
                    <li key={r.label}>
                      <strong>{r.label}:</strong> {r.field.note}
                    </li>
                  ))}
              </ul>
            )}

            <button
              className="te-apply-btn"
              onClick={() => apply.mutate({})}
              disabled={apply.isPending}
            >
              {apply.isPending ? 'Applying…' : 'Apply estimates to profile'}
            </button>
            {apply.isError && <span className="te-error">Failed to apply estimates</span>}
            {apply.isSuccess && !apply.isPending && (
              <span className="te-success">Applied to profile</span>
            )}
          </>
        )}
      </div>
    </section>
  )
}
