import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { useDateContext } from '../../App'
import { useToday, useRealignmentStatus, useRealignPlan } from '../../api/hooks'
import { formatDateKey, format, isToday as checkIsToday } from '../../utils/date'
import { formatDuration } from '../../utils/formatting'
import type { DailySummaryResponse, RaceInfo } from '../../api/types'
import WorkoutCard from './WorkoutCard'
import WeekOverview from './WeekOverview'
import TrainingLoadChart from './TrainingLoadChart'
import TodayHero from './TodayHero'
import DailyCheckinCard from './DailyCheckinCard'
import PlanAdaptationCard from './PlanAdaptationCard'
import InsightsList from './InsightsList'
import RacePacingCard from './RacePacingCard'
import StatGrid from '../activity-detail/StatGrid'
import StatHelpButton from '../info/StatHelpButton'
import AlertBanner from '../ui/AlertBanner'
import Skeleton from '../ui/Skeleton'
import './TodayView.css'

function TodayRealignmentBanner() {
  const { data: status } = useRealignmentStatus()
  const { mutate: realign, isPending } = useRealignPlan()

  if (!status?.should_prompt) return null

  return (
    <AlertBanner
      message={status.race_note ?? `${status.missed_count} session${status.missed_count !== 1 ? 's' : ''} missed`}
      actionLabel="Regenerate"
      onAction={() => realign('regenerate')}
      onDismiss={() => realign('dismiss')}
      pending={isPending}
    />
  )
}

function priorityColor(priority: string | null): string {
  if (priority === 'A') return 'var(--color-race)'
  if (priority === 'B') return 'var(--accent)'
  if (priority === 'C') return 'var(--text-muted)'
  return 'var(--color-race)'
}

function RaceStrip({ race }: { race: RaceInfo }) {
  const [expanded, setExpanded] = useState(false)
  const color = priorityColor(race.priority)

  return (
    <div className="race-strip" style={{ borderLeftColor: color }}>
      <button
        className="race-strip-summary"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <Flag size={13} style={{ color, flexShrink: 0 }} />
        <span className="race-strip-name">{race.title}</span>
        <span className="race-strip-days">{race.days_away} d</span>
        {race.goal_time_sec != null && (
          <span className="race-strip-goal">goal {formatDuration(race.goal_time_sec)}</span>
        )}
      </button>
      {expanded && race.id > 0 && <RacePacingCard race={race} />}
    </div>
  )
}

function buildGlanceStats(s: DailySummaryResponse): { label: string; value: string; unit?: string }[] {
  const stats: { label: string; value: string; unit?: string }[] = []
  if (s.resting_hr) stats.push({ label: 'RHR', value: String(s.resting_hr), unit: 'bpm' })
  if (s.sleep_score != null) stats.push({ label: 'Sleep', value: String(Math.round(s.sleep_score)) })
  if (s.body_battery_high != null) stats.push({ label: 'Body Battery', value: String(s.body_battery_high) })
  if (s.steps != null) stats.push({ label: 'Steps', value: s.steps.toLocaleString() })
  if (s.hrv_avg != null) stats.push({ label: 'HRV', value: String(Math.round(s.hrv_avg)), unit: 'ms' })
  return stats
}

function TodaySkeleton() {
  return (
    <div className="today-view">
      <div className="card">
        <div className="today-skeleton-hero-top">
          <Skeleton height={64} width={64} radius="50%" />
          <div className="today-skeleton-session">
            <Skeleton height={10} width="45%" />
            <Skeleton height={18} width="65%" />
            <Skeleton height={12} width="40%" />
          </div>
        </div>
        <Skeleton height={13} width="85%" />
      </div>
      <Skeleton height={44} radius={22} />
      <div className="stat-grid card" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="stat-cell">
            <Skeleton height={10} width="60%" />
            <Skeleton height={20} width="70%" />
          </div>
        ))}
      </div>
      <Skeleton height={140} radius="var(--radius)" />
      <Skeleton height={160} radius="var(--radius)" />
    </div>
  )
}

export default function TodayView() {
  const { selectedDate } = useDateContext()
  const dateKey = formatDateKey(selectedDate)
  const { data, isLoading } = useToday(dateKey)

  if (isLoading) return <TodaySkeleton />

  const isViewingToday = checkIsToday(selectedDate)

  // Activities that didn't fulfil today's plan/scheduled workout — the hero
  // already surfaces the matched one (workout_tag) in its completed state.
  const extraActivities = data?.activities.filter(a => a.workout_tag == null) ?? []
  const glanceStats = data?.daily_summary ? buildGlanceStats(data.daily_summary) : []

  return (
    <div className="today-view">
      {isViewingToday && <TodayRealignmentBanner />}

      {data && <TodayHero data={data} />}

      <section className="today-section">
        <DailyCheckinCard date={dateKey} checkin={data?.daily_checkin ?? null} />
      </section>

      {data?.plan_adaptation && (
        <section className="today-section">
          <PlanAdaptationCard suggestion={data.plan_adaptation} />
        </section>
      )}

      {data?.daily_summary && glanceStats.length > 0 && (
        <section className="today-section">
          <h2 className="section-title">At a Glance</h2>
          <Link to={`/daily/${data.daily_summary.id}`} className="daily-snapshot-link">
            <StatGrid stats={glanceStats} columns={4} />
          </Link>
        </section>
      )}

      {data?.next_races && data.next_races.length > 0 && (
        <section className="today-section today-races">
          {data.next_races.map(race => (
            <RaceStrip key={race.id} race={race} />
          ))}
        </section>
      )}

      {data?.training_load && (
        <section className="today-section">
          <div className="section-title-row">
            <h2 className="section-title">Training Load</h2>
            <StatHelpButton topic="training-load" label="Training Load" />
          </div>
          <TrainingLoadChart current={data.training_load} />
        </section>
      )}

      {data?.weekly_data && data.weekly_data.length > 0 && (
        <section className="today-section">
          <h2 className="section-title">Week {format(selectedDate, 'I')} Overview</h2>
          <WeekOverview data={data.weekly_data} />
        </section>
      )}

      {data?.insights && data.insights.length > 0 && (
        <section className="today-section">
          <h2 className="section-title">My Insights</h2>
          <InsightsList insights={data.insights} />
        </section>
      )}

      {extraActivities.length > 0 && (
        <section className="today-section">
          <h2 className="section-title">Also today</h2>
          <div className="workout-list">
            {extraActivities.map(a => (
              <WorkoutCard key={a.id} activity={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
