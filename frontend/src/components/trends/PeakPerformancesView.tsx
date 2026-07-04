import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { usePersonalRecords, useActivity } from '../../api/hooks'
import { formatDistance, formatDuration } from '../../utils/formatting'
import { format, parseISO } from '../../utils/date'
import type { PersonalRecordResponse } from '../../api/types'
import './PeakPerformancesView.css'

type Days = 30 | 90 | 365

const DAY_OPTIONS: { label: string; value: Days }[] = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
]

// Mirrors app.streams.RACE_DISTANCES_M — the API returns effort *time* only,
// so pace is derived client-side from each label's known nominal distance.
const DISTANCE_METERS: Record<string, number> = {
  '400m': 400,
  '1/2 mile': 804.672,
  '1K': 1000,
  '1 mile': 1609.344,
  '2 mile': 3218.688,
  '5K': 5000,
  '10K': 10000,
  '15K': 15000,
  '10 mile': 16093.44,
  '20K': 20000,
  'Half Marathon': 21097.5,
  '30K': 30000,
  Marathon: 42195,
}

function formatRaceTime(seconds: number): string {
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

function formatPaceForLabel(label: string, seconds: number): string | null {
  const meters = DISTANCE_METERS[label]
  if (!meters) return null
  const paceMinKm = seconds / (meters / 1000) / 60
  const m = Math.floor(paceMinKm)
  const s = Math.round((paceMinKm - m) * 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

function formatDate(iso: string): string {
  return format(parseISO(iso), 'MMMM d, yyyy')
}

function BestEffortDetail({ record }: { record: PersonalRecordResponse }) {
  const { data: activity, isLoading } = useActivity(record.activity_id)
  return (
    <Link to={`/activities/${record.activity_id}`} className="pr-effort-detail">
      <div className="pr-effort-detail-name">
        {isLoading ? 'Loading…' : activity?.name || `Activity #${record.activity_id}`}
      </div>
      {activity && (
        <div className="pr-effort-detail-stats">
          {formatDistance(activity.distance_m)} km · {formatDuration(activity.duration_sec)}
        </div>
      )}
      <div className="pr-effort-detail-date">{formatDate(record.achieved_at)}</div>
    </Link>
  )
}

function BestEffortRow({ record, rank }: { record: PersonalRecordResponse; rank: number }) {
  const [open, setOpen] = useState(rank === 1)
  const pace = formatPaceForLabel(record.distance_label ?? '', record.value)

  return (
    <div className="pr-effort-row">
      <button
        type="button"
        className={`pr-effort-row-header pr-effort-rank-${rank}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className={`pr-effort-medal pr-effort-medal-${rank}`}>
          {rank === 1 ? <Trophy size={15} /> : rank}
        </span>
        <span className="pr-effort-values">
          <span className="pr-effort-time">{formatRaceTime(record.value)}</span>
          {pace && <span className="pr-effort-pace">{pace}</span>}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <BestEffortDetail record={record} />}
    </div>
  )
}

export default function PeakPerformancesView() {
  const [recentDays, setRecentDays] = useState<Days>(90)
  const { data, isLoading } = usePersonalRecords(recentDays)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  if (isLoading) return <div className="pr-loading">Loading personal records…</div>

  const labels = data?.distance_labels ?? []
  const distanceBests = data?.distance_bests ?? {}
  const currentBests = data?.current_bests ?? []
  const recent = data?.recent ?? []
  const durationBests = currentBests.filter(r => r.record_type === 'duration')

  const hasAnyDistanceData = labels.some(l => (distanceBests[l]?.length ?? 0) > 0)
  const effectiveSelected =
    selectedLabel ?? labels.find(l => (distanceBests[l]?.length ?? 0) > 0) ?? labels[0]
  const selectedRecords = distanceBests[effectiveSelected] ?? []

  if (currentBests.length === 0 && !hasAnyDistanceData) {
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

      <div className="pr-card">
        <div className="pr-card-title">Best Efforts</div>
        <div className="pr-chip-row">
          {labels.map(label => (
            <button
              key={label}
              className={[
                'pr-chip',
                effectiveSelected === label ? 'active' : '',
                (distanceBests[label]?.length ?? 0) === 0 ? 'empty' : '',
              ].join(' ').trim()}
              onClick={() => setSelectedLabel(label)}
            >
              {label}
            </button>
          ))}
        </div>
        {selectedRecords.length === 0 ? (
          <div className="pr-empty-inline">No {effectiveSelected} effort recorded yet.</div>
        ) : (
          <div className="pr-effort-list">
            {selectedRecords.map((r, i) => (
              <BestEffortRow key={r.id} record={r} rank={i + 1} />
            ))}
          </div>
        )}
      </div>

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
                className={`pr-tab ${recentDays === o.value ? 'active' : ''}`}
                onClick={() => setRecentDays(o.value)}
              >{o.label}</button>
            ))}
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="pr-empty-inline">No new records in the last {recentDays} days.</div>
        ) : (
          <ul className="pr-recent-list">
            {recent.map(r => (
              <li key={r.id}>
                <Link to={`/activities/${r.activity_id}`} className="pr-recent-row">
                  <Trophy size={14} className="pr-recent-icon" />
                  <div className="pr-recent-text">
                    <div className="pr-recent-label">New {r.label} best: {r.display_value}</div>
                    <div className="pr-recent-meta">{formatDate(r.achieved_at)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
