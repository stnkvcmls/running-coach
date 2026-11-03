import { useDateContext } from '../../App'
import { useToday, useRealignmentStatus, useRealignPlan } from '../../api/hooks'
import { formatDateKey, isToday as checkIsToday } from '../../utils/date'
import WorkoutCard from './WorkoutCard'
import TodayHero, { findMatchedActivity } from './TodayHero'
import WeekRail from './WeekRail'
import DailyCheckinCard from './DailyCheckinCard'
import PlanAdaptationCard from './PlanAdaptationCard'
import BodyPanel from './BodyPanel'
import FormPanel from './FormPanel'
import RacesPanel from './RacesPanel'
import CoachNotes from './CoachNotes'
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

function TodaySkeleton() {
  return (
    <div className="today-skeleton" aria-busy="true">
      <div className="card">
        <Skeleton height={14} width="60%" />
        <div className="today-skeleton-session">
          <Skeleton height={12} width="30%" />
          <Skeleton height={40} width="70%" />
          <Skeleton height={14} width="55%" />
          <Skeleton height={16} width="100%" />
        </div>
      </div>
      <Skeleton height={140} radius="var(--radius)" />
      <Skeleton height={160} radius="var(--radius)" />
    </div>
  )
}

/*
 * Order (mobile, one flat stack): banner 1, week rail 2, hero 3 (readiness +
 * session), check-in 4, plan adaptation 5, Body 6, Form 7, Races 8, From your
 * coach 9, Also today 10. At >=1024px the banner and rail stay full-width
 * above two independent flex columns (left: hero, check-in, adaptation;
 * right: Body, Form, Races) and the notes + extra activities run full-width
 * below. `.today-columns`/`.today-col-*` are `display: contents` on mobile,
 * so the explicit `order` on every leaf restores this sequence there — see
 * tasks/lessons.md on why this isn't a CSS grid.
 */
export default function TodayView() {
  const { selectedDate } = useDateContext()
  const dateKey = formatDateKey(selectedDate)
  const { data, isLoading } = useToday(dateKey)
  const isViewingToday = checkIsToday(selectedDate)

  // The hero shows the activity that completed the day's session; anything
  // else recorded that day is listed under "Also today".
  const matched = data ? findMatchedActivity(data.activities) : null
  const extraActivities = data?.activities.filter(a => a !== matched) ?? []

  return (
    <div className="today-view">
      {isViewingToday && <div className="today-banner"><TodayRealignmentBanner /></div>}

      <div className="today-rail">
        <WeekRail />
      </div>

      {isLoading ? <TodaySkeleton /> : (
        <>
          <div className="today-columns">
            <div className="today-col today-col-left">
              {data && <TodayHero data={data} />}

              <div className="today-section" style={{ order: 4 }}>
                <DailyCheckinCard date={dateKey} checkin={data?.daily_checkin ?? null} />
              </div>

              {data?.plan_adaptation && (
                <div className="today-section" style={{ order: 5 }}>
                  <PlanAdaptationCard suggestion={data.plan_adaptation} />
                </div>
              )}
            </div>

            <div className="today-col today-col-right">
              {data?.daily_summary && (
                <div className="today-section" style={{ order: 6 }}>
                  <BodyPanel summary={data.daily_summary} />
                </div>
              )}

              {data?.training_load && (
                <div className="today-section" style={{ order: 7 }}>
                  <FormPanel current={data.training_load} dateKey={dateKey} />
                </div>
              )}

              {data && (
                <div className="today-section" style={{ order: 8 }}>
                  <RacesPanel races={data.next_races} dateKey={dateKey} />
                </div>
              )}
            </div>
          </div>

          {data?.insights && data.insights.length > 0 && (
            <div className="today-section today-full" style={{ order: 9 }}>
              <CoachNotes insights={data.insights} />
            </div>
          )}

          {extraActivities.length > 0 && (
            <section className="today-section today-full" style={{ order: 10 }} aria-labelledby="also-today-title">
              <h2 id="also-today-title" className="section-title">{isViewingToday ? 'Also today' : 'Also that day'}</h2>
              <div className="workout-list">
                {extraActivities.map(a => (
                  <WorkoutCard key={a.id} activity={a} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
