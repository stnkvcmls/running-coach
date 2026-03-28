import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useDailySummary } from '../../api/hooks'
import { format, parseISO } from '../../utils/date'
import { formatSleepHours } from '../../utils/formatting'
import StatGrid from '../activity-detail/StatGrid'
import WorkoutCard from '../today/WorkoutCard'
import AiInsightCard from '../activity-detail/AiInsightCard'
import './DailyDetailView.css'

export default function DailyDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useDailySummary(Number(id) || 0)

  if (isLoading) return <div className="spinner" />
  if (!data) return <div className="empty-state">Not found</div>

  const s = data.summary
  const stats = [
    s.resting_hr ? { label: 'Resting HR', value: `${s.resting_hr}`, unit: 'bpm' } : null,
    s.max_hr ? { label: 'Max HR', value: `${s.max_hr}`, unit: 'bpm' } : null,
    s.steps ? { label: 'Steps', value: s.steps.toLocaleString() } : null,
    s.total_calories ? { label: 'Calories', value: s.total_calories.toLocaleString(), unit: 'kcal' } : null,
    s.active_calories ? { label: 'Active Cal', value: s.active_calories.toLocaleString(), unit: 'kcal' } : null,
    s.sleep_seconds ? { label: 'Sleep', value: formatSleepHours(s.sleep_seconds) } : null,
    s.sleep_score != null ? { label: 'Sleep Score', value: `${Math.round(s.sleep_score)}` } : null,
    s.body_battery_high != null ? { label: 'Battery High', value: `${s.body_battery_high}` } : null,
    s.body_battery_low != null ? { label: 'Battery Low', value: `${s.body_battery_low}` } : null,
    s.stress_avg ? { label: 'Stress Avg', value: `${s.stress_avg}` } : null,
    s.intensity_minutes ? { label: 'Intensity', value: `${s.intensity_minutes}`, unit: 'min' } : null,
    s.floors_climbed ? { label: 'Floors', value: `${s.floors_climbed}` } : null,
  ].filter(Boolean) as { label: string; value: string; unit?: string }[]

  return (
    <div className="daily-detail">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-header-info">
          <h1 className="detail-title">{format(parseISO(s.date), 'EEEE, d MMMM yyyy')}</h1>
          <span className="detail-date">Daily Summary</span>
        </div>
      </header>

      <div className="detail-body">
        <StatGrid stats={stats} columns={3} />

        {data.activities.length > 0 && (
          <section className="detail-section">
            <h3 className="section-title">Activities</h3>
            <div className="workout-list">
              {data.activities.map(a => (
                <WorkoutCard key={a.id} activity={a} />
              ))}
            </div>
          </section>
        )}

        {data.insight && (
          <AiInsightCard
            insight={data.insight}
            onReanalyze={() => {}}
            isAnalyzing={false}
          />
        )}
      </div>
    </div>
  )
}
