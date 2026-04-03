import { useDateContext } from '../../App'
import { useToday } from '../../api/hooks'
import { formatDateKey, format, isToday as checkIsToday } from '../../utils/date'
import { formatDuration } from '../../utils/formatting'
import WorkoutCard from './WorkoutCard'
import ScheduledWorkoutCard from './ScheduledWorkoutCard'
import WeekOverview from './WeekOverview'
import InsightsList from './InsightsList'
import './TodayView.css'

function formatPriority(priority: string | null): string | null {
  if (priority === 'A') return 'Primary'
  if (priority === 'B') return 'Secondary'
  if (priority === 'C') return 'C Priority'
  return null
}

export default function TodayView() {
  const { selectedDate } = useDateContext()
  const dateKey = formatDateKey(selectedDate)
  const { data, isLoading } = useToday(dateKey)

  if (isLoading) return <div className="spinner" />

  const dateLabel = checkIsToday(selectedDate)
    ? 'Today'
    : format(selectedDate, 'EEEE, d MMM')

  return (
    <div className="today-view">
      {/* Today's workouts */}
      <section className="today-section">
        <h2 className="section-title">{dateLabel}'s workouts</h2>
        {data?.activities && data.activities.length > 0 ? (
          <div className="workout-list">
            {data.activities.map(a => (
              <WorkoutCard key={a.id} activity={a} />
            ))}
          </div>
        ) : (
          <div className="card empty-state">No workouts on this day</div>
        )}
      </section>

      {/* Scheduled workouts */}
      {data?.scheduled_events && data.scheduled_events.length > 0 && (
        <section className="today-section">
          <h2 className="section-title">Scheduled</h2>
          <div className="workout-list">
            {data.scheduled_events.map(e => (
              <ScheduledWorkoutCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Races */}
      {data?.next_races && data.next_races.length > 0 && (
        <section className="today-section">
          {data.next_races.map(race => (
            <div key={race.id} className="card race-card">
              {formatPriority(race.priority) && (
                <div className="race-priority-badge">
                  {formatPriority(race.priority)}
                </div>
              )}
              <div className="race-days">{race.days_away} days</div>
              <div className="race-name">{race.title}</div>
              {race.distance_label && (
                <div className="race-distance">{race.distance_label}</div>
              )}
              {race.goal_time_sec != null && (
                <div className="race-goal-time">
                  Goal: {formatDuration(race.goal_time_sec)}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Daily summary snapshot */}
      {data?.daily_summary && (
        <section className="today-section">
          <h2 className="section-title">Daily Summary</h2>
          <div className="card daily-snapshot">
            <div className="snap-grid">
              {data.daily_summary.resting_hr && (
                <div className="snap-item">
                  <span className="stat-label">Resting HR</span>
                  <span className="stat-value">{data.daily_summary.resting_hr} <span className="stat-unit">bpm</span></span>
                </div>
              )}
              {data.daily_summary.sleep_score != null && (
                <div className="snap-item">
                  <span className="stat-label">Sleep</span>
                  <span className="stat-value">{Math.round(data.daily_summary.sleep_score)}</span>
                </div>
              )}
              {data.daily_summary.body_battery_high != null && (
                <div className="snap-item">
                  <span className="stat-label">Body Battery</span>
                  <span className="stat-value">{data.daily_summary.body_battery_high}</span>
                </div>
              )}
              {data.daily_summary.steps != null && (
                <div className="snap-item">
                  <span className="stat-label">Steps</span>
                  <span className="stat-value">{data.daily_summary.steps.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Week overview chart */}
      {data?.weekly_data && data.weekly_data.length > 0 && (
        <section className="today-section">
          <h2 className="section-title">Week {format(selectedDate, 'I')} Overview</h2>
          <WeekOverview data={data.weekly_data} />
        </section>
      )}

      {/* My insights */}
      {data?.insights && data.insights.length > 0 && (
        <section className="today-section">
          <h2 className="section-title">My Insights</h2>
          <InsightsList insights={data.insights} />
        </section>
      )}
    </div>
  )
}
