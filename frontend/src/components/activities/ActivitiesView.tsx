import { useState, useMemo, useEffect, useRef } from 'react'
import { useActivities } from '../../api/hooks'
import { format, parseISO } from '../../utils/date'
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

export default function ActivitiesView() {
  const [activeFilter, setActiveFilter] = useState('')
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useActivities(activeFilter || undefined)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const activities = useMemo(() => data?.pages.flat() ?? [], [data])

  const grouped = useMemo(() => {
    const groups: { month: string; items: typeof activities }[] = []
    let currentMonth = ''
    let currentItems: typeof activities = []

    for (const a of activities) {
      const m = a.started_at ? format(parseISO(a.started_at), 'MMMM yyyy') : 'Unknown'
      if (m !== currentMonth) {
        if (currentItems.length > 0) groups.push({ month: currentMonth, items: currentItems })
        currentMonth = m
        currentItems = [a]
      } else {
        currentItems.push(a)
      }
    }
    if (currentItems.length > 0) groups.push({ month: currentMonth, items: currentItems })
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
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`chip ${activeFilter === f.value ? 'active' : ''}`}
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
        <div key={group.month} className="activity-group">
          <h3 className="group-month">{group.month}</h3>
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
