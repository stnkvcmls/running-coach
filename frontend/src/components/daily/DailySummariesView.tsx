import { useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDailySummaries } from '../../api/hooks'
import { format, parseISO } from '../../utils/date'
import { formatSleepHours } from '../../utils/formatting'
import './DailySummariesView.css'

export default function DailySummariesView() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useDailySummaries()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const summaries = useMemo(() => data?.pages.flat() ?? [], [data])

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

  if (isLoading) return <div className="spinner" />
  if (error) return <div className="empty-state">Failed to load daily summaries</div>

  return (
    <div className="daily-view">
      <h2 className="section-title">Daily Summaries</h2>
      {summaries.length === 0 && (
        <div className="empty-state">No daily summaries yet</div>
      )}
      <div className="daily-list">
        {summaries.map(s => (
          <Link key={s.id} to={`/daily/${s.id}`} className="daily-card card">
            <div className="daily-date-col">
              <span className="daily-day">{format(parseISO(s.date), 'd')}</span>
              <span className="daily-month">{format(parseISO(s.date), 'MMM')}</span>
            </div>
            <div className="daily-stats-col">
              <div className="daily-stat-row">
                {s.resting_hr && (
                  <div className="daily-stat">
                    <span className="stat-label">RHR</span>
                    <span className="stat-value">{s.resting_hr}</span>
                  </div>
                )}
                {s.sleep_score != null && (
                  <div className="daily-stat">
                    <span className="stat-label">Sleep</span>
                    <span className="stat-value">{Math.round(s.sleep_score)}</span>
                  </div>
                )}
                {s.body_battery_high != null && (
                  <div className="daily-stat">
                    <span className="stat-label">Battery</span>
                    <span className="stat-value">{s.body_battery_high}</span>
                  </div>
                )}
                {s.steps != null && (
                  <div className="daily-stat">
                    <span className="stat-label">Steps</span>
                    <span className="stat-value">{(s.steps / 1000).toFixed(1)}k</span>
                  </div>
                )}
                {s.stress_avg != null && (
                  <div className="daily-stat">
                    <span className="stat-label">Stress</span>
                    <span className="stat-value">{s.stress_avg}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div ref={sentinelRef} className="scroll-sentinel" />

      {isFetchingNextPage && <div className="spinner" />}
    </div>
  )
}
