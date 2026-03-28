import { useState, useMemo } from 'react'
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
  const [page, setPage] = useState(1)
  const { data: activities, isLoading } = useActivities(page, activeFilter || undefined)

  // Group by month
  const grouped = useMemo(() => {
    if (!activities) return []
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

  return (
    <div className="activities-view">
      {/* Filter chips */}
      <div className="filter-chips">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`chip ${activeFilter === f.value ? 'active' : ''}`}
            onClick={() => { setActiveFilter(f.value); setPage(1) }}
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

      {activities && activities.length >= 30 && (
        <div className="load-more-wrap">
          <button className="load-more-btn" onClick={() => setPage(p => p + 1)}>
            Load more
          </button>
        </div>
      )}
    </div>
  )
}
