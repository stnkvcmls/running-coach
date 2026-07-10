import { useState, useMemo, useEffect, useRef } from 'react'
import { useActivities } from '../../api/hooks'
import { format, parseISO, weeksSinceCurrentWeek, getWeekNumber, startOfWeek } from '../../utils/date'
import type { ActivitySummary } from '../../api/types'
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

function groupKey(startedAt: string): { key: string; label: string; sortKey: string } {
  const date = parseISO(startedAt)
  const weeksAgo = weeksSinceCurrentWeek(date)
  if (weeksAgo >= 0 && weeksAgo < WEEK_GROUPING_HORIZON) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const sortKey = format(weekStart, 'yyyy-MM-dd')
    return { key: `w-${sortKey}`, label: `Week ${getWeekNumber(weekStart)}`, sortKey }
  }
  const sortKey = format(date, 'yyyy-MM')
  return { key: `m-${sortKey}`, label: format(date, 'MMMM yyyy'), sortKey }
}

function summarizeGroup(items: ActivitySummary[]): string {
  const km = items.reduce((sum, a) => sum + (a.distance_m || 0), 0) / 1000
  const allRuns = items.every(a => (a.activity_type || '').toLowerCase().includes('run'))
  const noun = allRuns
    ? (items.length === 1 ? 'run' : 'runs')
    : (items.length === 1 ? 'activity' : 'activities')
  return `${items.length} ${noun} · ${km.toFixed(1)} km`
}

export default function ActivitiesView() {
  const [activeFilter, setActiveFilter] = useState('')
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useActivities(activeFilter || undefined)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const activities = useMemo(() => data?.pages.flat() ?? [], [data])

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

  const grouped = useMemo(() => {
    const groups: { key: string; label: string; sortKey: string; items: ActivitySummary[] }[] = []
    let current: (typeof groups)[number] | null = null

    for (const a of activities) {
      const g = a.started_at ? groupKey(a.started_at) : { key: 'unknown', label: 'Unknown', sortKey: '' }
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
        <div className="empty-state">No activities found</div>
      )}

      {grouped.map(group => (
        <div key={group.key} className="activity-group">
          <div className="group-head">
            <span>{group.label}</span>
            <b>{summarizeGroup(group.items)}</b>
          </div>
          <div className="group-list">
            {group.items.map(a => (
              <ActivityListItem key={a.id} activity={a} />
            ))}
          </div>
        </div>
      ))}

      <div ref={sentinelRef} className="scroll-sentinel" />

      {isFetchingNextPage && <div className="spinner" />}
    </div>
  )
}
