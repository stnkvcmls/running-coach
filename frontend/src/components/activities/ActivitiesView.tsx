import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useActivities, useGarminStatus, useTrainingPlan } from '../../api/hooks'
import { format, parseISO, weeksSinceCurrentWeek, startOfWeek, formatDateKey } from '../../utils/date'
import type { ActivitySummary, TrainingPlanResponse } from '../../api/types'
import { celebrateNewRecords } from '../../utils/records'
import ActivityListItem from './ActivityListItem'
import './ActivitiesView.css'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Running', value: 'running' },
  { label: 'Trail', value: 'trail_running' },
  { label: 'Cycling', value: 'cycling' },
  { label: 'Walking', value: 'walking' },
  { label: 'Swimming', value: 'lap_swimming' },
]

const WEEK_GROUPING_HORIZON = 8 // most recent N ISO weeks group by week; older activities group by month

function humanizeType(type: string): string {
  return type
    .split('_')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface GroupKey {
  key: string
  label: string
  sortKey: string
  /** Monday of the group's ISO week ('yyyy-MM-dd'); month groups have none. */
  weekStart?: string
  isCurrentWeek?: boolean
}

/** "15–21 June", or "29 June – 5 July" when the week spans two months (A3). */
export function weekRangeLabel(weekStart: Date): string {
  const end = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
  return weekStart.getMonth() === end.getMonth()
    ? `${format(weekStart, 'd')}–${format(end, 'd MMMM')}`
    : `${format(weekStart, 'd MMMM')} – ${format(end, 'd MMMM')}`
}

function groupKey(startedAt: string): GroupKey {
  const date = parseISO(startedAt)
  const weeksAgo = weeksSinceCurrentWeek(date)
  if (weeksAgo >= 0 && weeksAgo < WEEK_GROUPING_HORIZON) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const sortKey = formatDateKey(weekStart)
    return {
      key: `w-${sortKey}`,
      label: weeksAgo === 0 ? 'This week' : weekRangeLabel(weekStart),
      sortKey,
      weekStart: sortKey,
      isCurrentWeek: weeksAgo === 0,
    }
  }
  const sortKey = format(date, 'yyyy-MM')
  return { key: `m-${sortKey}`, label: format(date, 'MMMM yyyy'), sortKey }
}

const isRun = (a: ActivitySummary) => (a.activity_type || '').toLowerCase().includes('run')

function formatKm(km: number): string {
  const rounded = Math.round(km * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function summarizeGroup(items: ActivitySummary[]): string {
  const km = items.reduce((sum, a) => sum + (a.distance_m || 0), 0) / 1000
  const noun = items.every(isRun)
    ? (items.length === 1 ? 'run' : 'runs')
    : (items.length === 1 ? 'activity' : 'activities')
  return `${items.length} ${noun}, ${km.toFixed(1)} km`
}

/** Planned km for the ISO week starting `weekStart` ('yyyy-MM-dd'), or null
 * when the plan sets no distance targets that week. */
function plannedKmForWeek(plan: TrainingPlanResponse | null | undefined, weekStart: string): number | null {
  if (!plan || !Array.isArray(plan.weeks)) return null
  const start = parseISO(weekStart)
  const weekEnd = formatDateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))
  const meters = plan.weeks
    .flatMap(w => w.days ?? [])
    .filter(d => d.day_date >= weekStart && d.day_date <= weekEnd)
    .reduce((sum, d) => sum + (d.target_distance_m ?? 0), 0)
  return meters > 0 ? meters / 1000 : null
}

function GroupSummary({ items, plannedKm }: { items: ActivitySummary[]; plannedKm: number | null }) {
  if (plannedKm == null) return <span className="group-sum">{summarizeGroup(items)}</span>
  const runKm = items.filter(isRun).reduce((sum, a) => sum + (a.distance_m || 0), 0) / 1000
  return (
    <span className="group-sum">
      <b className="num">{runKm.toFixed(1)}</b> of {formatKm(plannedKm)} km planned
    </span>
  )
}

export default function ActivitiesView() {
  const [activeFilter, setActiveFilter] = useState('')
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useActivities(activeFilter || undefined)
  const { data: garminStatus } = useGarminStatus()
  const { data: plan } = useTrainingPlan()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const activities = useMemo(() => data?.pages.flat() ?? [], [data])

  useEffect(() => {
    celebrateNewRecords(activities.flatMap(a => a.personal_records ?? []))
  }, [activities])

  // Chips grow to include every distinct activity_type seen across any filter,
  // so switching filters never makes previously-discovered chips disappear.
  const [discoveredTypes, setDiscoveredTypes] = useState<Set<string>>(new Set())
  useEffect(() => {
    setDiscoveredTypes(prev => {
      let changed = false
      const next = new Set(prev)
      for (const a of activities) {
        if (a.activity_type && !next.has(a.activity_type)) {
          next.add(a.activity_type)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [activities])

  const filters = useMemo(() => {
    const known = new Set(FILTERS.map(f => f.value).filter(Boolean))
    const extra = [...discoveredTypes].filter(t => !known.has(t)).sort()
    return [...FILTERS, ...extra.map(t => ({ label: humanizeType(t), value: t }))]
  }, [discoveredTypes])

  // The plan prescribes runs, so "of N km planned" only makes sense while the
  // list includes runs.
  const showsRuns = activeFilter === '' || activeFilter.includes('run')

  const grouped = useMemo(() => {
    const groups: (GroupKey & { items: ActivitySummary[] })[] = []
    let current: (typeof groups)[number] | null = null

    for (const a of activities) {
      const g: GroupKey = a.started_at ? groupKey(a.started_at) : { key: 'unknown', label: 'Unknown', sortKey: '' }
      if (!current || current.key !== g.key) {
        current = { ...g, items: [] }
        groups.push(current)
      }
      current.items.push(a)
    }
    return groups
  }, [activities])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <div className="activities-view">
      <div className="filter-chips">
        {filters.map(f => (
          <button
            key={f.value}
            className={`chip ${activeFilter === f.value ? 'active' : ''}`}
            aria-pressed={activeFilter === f.value}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="spinner" />}

      {!isLoading && grouped.length === 0 && (
        <div className="empty-state">
          {garminStatus && !garminStatus.connected ? (
            <>
              <p>Connect Garmin to start tracking your runs.</p>
              <Link to="/settings/garmin" className="btn-primary">Connect Garmin in Settings</Link>
            </>
          ) : (
            <p>No activities found</p>
          )}
        </div>
      )}

      {grouped.map(group => (
        <section key={group.key} className="activity-group" aria-label={group.label}>
          <div className="group-head">
            <h3>{group.label}</h3>
            <GroupSummary
              items={group.items}
              plannedKm={group.isCurrentWeek && showsRuns ? plannedKmForWeek(plan, group.weekStart!) : null}
            />
          </div>
          <div className="group-list">
            {group.items.map(a => (
              <ActivityListItem key={a.id} activity={a} />
            ))}
          </div>
        </section>
      ))}

      <div ref={sentinelRef} className="scroll-sentinel" />

      {isFetchingNextPage && <div className="spinner" />}
    </div>
  )
}
