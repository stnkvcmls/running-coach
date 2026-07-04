import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { usePersonalRecords } from '../../api/hooks'
import type { PersonalRecordResponse } from '../../api/types'
import './PeakPerformancesView.css'

type Days = 30 | 90 | 365

const DAY_OPTIONS: { label: string; value: Days }[] = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
]

function formatRaceTime(seconds: number): string {
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

function formatPreviousValue(r: PersonalRecordResponse): string | null {
  if (r.previous_value == null) return null
  if (r.record_type === 'distance') return formatRaceTime(r.previous_value)
  if (r.metric === 'power') return `${r.previous_value.toFixed(0)} W`
  const paceMinKm = (1000 / r.previous_value) / 60
  const m = Math.floor(paceMinKm)
  const sec = Math.round((paceMinKm - m) * 60)
  return `${m}:${String(sec).padStart(2, '0')}/km`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PeakPerformancesView() {
  const [days, setDays] = useState<Days>(90)
  const { data, isLoading } = usePersonalRecords(days)

  if (isLoading) return <div className="pr-loading">Loading personal records…</div>

  const currentBests = data?.current_bests ?? []
  const recent = data?.recent ?? []
  const distanceBests = currentBests.filter(r => r.record_type === 'distance')
  const durationBests = currentBests.filter(r => r.record_type === 'duration')

  if (currentBests.length === 0) {
    return (
      <div className="pr-view">
        <div className="pr-header">
          <span className="pr-title">Peak Performances</span>
        </div>
        <div className="pr-empty">
          No personal records yet. Bests are detected automatically as you sync activities with
          power or GPS data.
        </div>
      </div>
    )
  }

  return (
    <div className="pr-view">
      <div className="pr-header">
        <span className="pr-title">Peak Performances</span>
      </div>

      {distanceBests.length > 0 && (
        <div className="pr-card">
          <div className="pr-card-title">Race Distance Bests</div>
          <div className="pr-grid">
            {distanceBests.map(r => (
              <Link key={r.id} to={`/activities/${r.activity_id}`} className="pr-tile">
                <div className="pr-tile-label">{r.label}</div>
                <div className="pr-tile-value">{r.display_value}</div>
                <div className="pr-tile-date">{formatDate(r.achieved_at)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {durationBests.length > 0 && (
        <div className="pr-card">
          <div className="pr-card-title">Duration Bests</div>
          <div className="pr-grid">
            {durationBests.map(r => (
              <Link key={r.id} to={`/activities/${r.activity_id}`} className="pr-tile">
                <div className="pr-tile-label">{r.label}</div>
                <div className="pr-tile-value">{r.display_value}</div>
                <div className="pr-tile-date">{formatDate(r.achieved_at)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="pr-card">
        <div className="pr-card-title-row">
          <div className="pr-card-title">Recent Records</div>
          <div className="pr-tab-strip">
            {DAY_OPTIONS.map(o => (
              <button
                key={o.value}
                className={`pr-tab ${days === o.value ? 'active' : ''}`}
                onClick={() => setDays(o.value)}
              >{o.label}</button>
            ))}
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="pr-empty-inline">No new records in the last {days} days.</div>
        ) : (
          <ul className="pr-recent-list">
            {recent.map(r => {
              const prev = formatPreviousValue(r)
              return (
                <li key={r.id}>
                  <Link to={`/activities/${r.activity_id}`} className="pr-recent-row">
                    <Trophy size={14} className="pr-recent-icon" />
                    <div className="pr-recent-text">
                      <div className="pr-recent-label">New {r.label} best: {r.display_value}</div>
                      <div className="pr-recent-meta">
                        {formatDate(r.achieved_at)}{prev ? ` · previous: ${prev}` : ''}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
