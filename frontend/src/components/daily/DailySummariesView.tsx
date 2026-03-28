import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDailySummaries } from '../../api/hooks'
import { format, parseISO } from '../../utils/date'
import { formatSleepHours } from '../../utils/formatting'
import './DailySummariesView.css'

export default function DailySummariesView() {
  const [page, setPage] = useState(1)
  const { data: summaries, isLoading } = useDailySummaries(page)
  const navigate = useNavigate()

  if (isLoading) return <div className="spinner" />

  return (
    <div className="daily-view">
      <h2 className="section-title">Daily Summaries</h2>
      {(!summaries || summaries.length === 0) && (
        <div className="empty-state">No daily summaries yet</div>
      )}
      <div className="daily-list">
        {summaries?.map(s => (
          <div key={s.id} className="daily-card card" onClick={() => navigate(`/daily/${s.id}`)}>
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
          </div>
        ))}
      </div>

      {summaries && summaries.length >= 30 && (
        <div className="load-more-wrap">
          <button className="load-more-btn" onClick={() => setPage(p => p + 1)}>Load more</button>
        </div>
      )}
    </div>
  )
}
