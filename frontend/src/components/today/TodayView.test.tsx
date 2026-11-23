import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import { DateContext } from '../../App'
import TodayView from './TodayView'
import type {
  PlanRealignmentStatus,
  RaceInfo,
  SeasonPlanResponse,
  TodayResponse,
  TrainingPlanResponse,
} from '../../api/types'

const TODAY: TodayResponse = {
  selected_date: '2026-07-09',
  activities: [{
    id: 3, garmin_id: null, activity_type: 'running', name: 'Easy shakeout',
    started_at: '2026-07-09T17:00:00Z', duration_sec: 1800, distance_m: 5000,
    avg_hr: 140, max_hr: 155, avg_pace_min_km: 6.0, calories: 300, elevation_gain: 10,
    workout_tag: null,
  }],
  daily_summary: {
    id: 42, date: '2026-07-09', steps: 8000, total_calories: 2200, active_calories: 600,
    resting_hr: 46, max_hr: 170, stress_avg: 30, sleep_seconds: 27000, sleep_score: 82,
    body_battery_high: 71, body_battery_low: 20, intensity_minutes: 40, floors_climbed: 8,
    hrv_avg: 55, hrv_weekly_avg: 53, hrv_status: 'LOW',
  },
  weekly_data: [{ label: 'Jul 06', km: 42, by_type: { run: 42 } }],
  insights: [
    { id: 1, created_at: '2026-07-08T07:00:00Z', trigger_type: 'trend', trigger_id: null, content: 'Resting HR is back to 48. Keep Wednesday easy.', summary: 'Recovery is trending well', category: 'trend' },
    { id: 2, created_at: '2026-07-06T07:00:00Z', trigger_type: 'activity', trigger_id: 3, content: 'Controlled effort.', summary: "Saturday's easy run", category: 'activity' },
    { id: 3, created_at: '2026-07-01T07:00:00Z', trigger_type: 'trend', trigger_id: null, content: 'Old note.', summary: 'An older note', category: 'trend' },
  ],
  next_races: [{ id: 9, title: 'Spring 10K', date: '2026-07-27', distance_label: '10K', days_away: 18, goal_time_sec: 2400, priority: 'B' }],
  scheduled_events: [],
  training_load: {
    date: '2026-07-09', tss: 50, ctl: 62, atl: 44, tsb: 17, acwr: 1.1,
    ramp_rate_7d: null, ramp_rate_28d: null, injury_risk: 'low',
    form_zone: 'very_fresh', form_zone_label: 'Very fresh — detraining risk', rsb_zone: 'productive',
    rsb_zone_label: 'Productive', rsb_recommendation: null, sport_breakdown: null,
  },
  readiness: {
    score: 78, label: 'Good', verdict: 'train', verdict_label: 'Train as planned', reasons: [],
    sleep_component: 80, recovery_component: 75,
    fatigue_component: 70, rhr_component: 82, hrv_component: 76, subjective_component: null,
  },
  plan_adaptation: {
    plan_day_id: 5, direction: 'downgrade', current_workout_type: 'Tempo',
    suggested_workout_type: 'Easy', current_target_distance_m: 10000,
    suggested_target_distance_m: 6000, reason: 'Readiness is low.',
    readiness_score: 38, trigger: 'readiness',
  },
  daily_checkin: null,
  plan_day_id: null,
  briefing: null,
}

const REALIGNMENT: PlanRealignmentStatus = {
  should_prompt: true,
  missed_count: 2,
  total_scheduled: 5,
  missed_sessions: [],
  race_note: null,
}

interface Options {
  today?: TodayResponse
  plan?: TrainingPlanResponse | null
  season?: SeasonPlanResponse | null
  activityDetail?: Record<string, unknown> | null
}

function mockFetch({ today = TODAY, plan = null, season = null, activityDetail = null }: Options = {}) {
  const fn = vi.fn().mockImplementation((url: string) => {
    const body =
      url.includes('/realignment-status') ? REALIGNMENT
      : url.endsWith('/training-plan') ? plan
      : url.includes('/season-plan') ? season
      : url.includes('/activities/') ? activityDetail
      : url.includes('/today') ? today
      : url.includes('/calendar/week') ? []
      : url.includes('/wellness-trends') ? []
      : url.includes('/training-load') ? { points: [], current: null }
      : {}
    return Promise.resolve({ ok: true, status: 200, json: async () => body })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

const NON_RUN_ACTIVITY = {
  ...TODAY.activities[0],
  activity_type: 'cycling',
  name: 'Easy spin',
}

describe('TodayView layout', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders rail, hero, check-in, Body, Races, coach notes and "Also today" in that order', async () => {
    mockFetch({ today: { ...TODAY, activities: [NON_RUN_ACTIVITY] } })
    const { container } = renderWithProviders(<TodayView />)
    await screen.findByText('Body')

    const order = [
      container.querySelector('.week-rail'),
      screen.getByRole('region', { name: "Today's session" }),
      screen.getByText('How do you feel today?'),
      screen.getByRole('heading', { name: 'Body' }),
      screen.getByRole('heading', { name: 'Races' }),
      screen.getByRole('heading', { name: 'From your coach' }),
      screen.getByRole('heading', { name: 'Also today' }),
    ]
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
    expect(screen.queryByRole('heading', { name: 'Form' })).not.toBeInTheDocument()
  })

  it('drops the old score ring, glance grid (with steps), training-load chart and week overview', async () => {
    mockFetch()
    const { container } = renderWithProviders(<TodayView />)
    await screen.findByText('Body')

    expect(screen.queryByText('At a glance')).not.toBeInTheDocument()
    expect(screen.queryByText('Steps')).not.toBeInTheDocument()
    expect(screen.queryByText('Training load')).not.toBeInTheDocument()
    expect(screen.queryByText(/overview/i)).not.toBeInTheDocument()
    expect(screen.queryByText('ACWR')).not.toBeInTheDocument()
    expect(container.querySelector('.score-ring')).toBeNull()
  })

  it('puts the alert banner above the week rail and the hero', async () => {
    mockFetch()
    const { container } = renderWithProviders(<TodayView />)
    const banner = await screen.findByText(/sessions missed/)
    const rail = container.querySelector('.week-rail')!
    expect(banner.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('Body shows four metrics with Garmin HRV status and links to the daily summary', async () => {
    mockFetch()
    renderWithProviders(<TodayView />)
    const body = (await screen.findByRole('heading', { name: 'Body' })).closest('section')!

    for (const label of ['Resting HR', 'HRV overnight', 'Sleep score', 'Body battery']) {
      expect(within(body).getByText(label)).toBeInTheDocument()
    }
    expect(within(body).getByText('Low, per Garmin')).toBeInTheDocument()
    expect(within(body).getByRole('link', { name: 'Daily history' })).toHaveAttribute('href', '/daily/42')
  })

  it('does not render the Form panel on Today', async () => {
    mockFetch()
    renderWithProviders(<TodayView />)
    await screen.findByText('Body')
    expect(screen.queryByRole('heading', { name: 'Form' })).not.toBeInTheDocument()
  })

  it('From your coach shows the latest two notes with dates and expands to all', async () => {
    mockFetch()
    renderWithProviders(<TodayView />)
    const notes = (await screen.findByRole('heading', { name: 'From your coach' })).closest('section')!

    expect(within(notes).getByText('Recovery is trending well')).toBeInTheDocument()
    expect(within(notes).getByText('Resting HR is back to 48.')).toBeInTheDocument()
    expect(within(notes).getByRole('link', { name: 'Open the run' })).toHaveAttribute('href', '/activities/3')
    expect(within(notes).queryByText('An older note')).not.toBeInTheDocument()
    fireEvent.click(within(notes).getByRole('button', { name: 'All notes' }))
    expect(within(notes).getByText('An older note')).toBeInTheDocument()
  })

  it('lists the non-matching activity under "Also today" but not the matched one', async () => {
    const matched = { ...TODAY.activities[0], id: 4, name: 'Intervals', workout_tag: 'Intervals', matched_plan_day_id: 5 }
    mockFetch({ today: { ...TODAY, activities: [matched, ...TODAY.activities] } })
    renderWithProviders(<TodayView />)

    const section = (await screen.findByRole('heading', { name: 'Also today' })).closest('section')!
    expect(section).toHaveTextContent('Easy shakeout')
    expect(section).not.toHaveTextContent('Intervals')
  })

  it('groups panels into the desktop two-column layout', async () => {
    mockFetch({ today: { ...TODAY, activities: [NON_RUN_ACTIVITY] } })
    const { container } = renderWithProviders(<TodayView />)
    await screen.findByText('Body')

    const left = container.querySelector('.today-col-left')!
    const right = container.querySelector('.today-col-right')!
    expect(within(left as HTMLElement).getByRole('region', { name: "Today's session" })).toBeInTheDocument()
    expect(left).toHaveTextContent('How do you feel today?')
    expect(right).toHaveTextContent('Body')
    expect(right).not.toHaveTextContent('Form')
    expect(right).toHaveTextContent('Races')

    const columns = container.querySelector('.today-columns')!
    const notes = screen.getByRole('heading', { name: 'From your coach' })
    const alsoToday = screen.getByRole('heading', { name: 'Also today' })
    expect(columns.compareDocumentPosition(notes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(columns.compareDocumentPosition(alsoToday) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('TodayView check-in visibility', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows the check-in card today before a run exists', async () => {
    mockFetch({ today: { ...TODAY, activities: [], daily_checkin: null } })
    renderWithProviders(<TodayView />)

    expect(await screen.findByRole('heading', { name: 'How do you feel today?' })).toBeInTheDocument()
  })

  it('hides the check-in card once a running activity exists today and shows the RPE prompt instead', async () => {
    const matchedRun = {
      ...TODAY.activities[0],
      id: 3,
      activity_type: 'running',
      matched_plan_day_id: 5,
      workout_tag: 'Easy',
    }
    mockFetch({
      today: { ...TODAY, activities: [matchedRun], daily_checkin: null, plan_day_id: 5 },
      activityDetail: {
        id: 3, rpe: null, feedback_rating: null, feedback_tags: null, feedback_text: null,
        scheduled_workout: null, adherence: null,
      },
    })
    renderWithProviders(<TodayView />)

    expect(await screen.findByText('How hard did it feel?')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'How do you feel today?' })).not.toBeInTheDocument()
  })

  it('shows the compact check-in chip when a check-in already exists even after a run', async () => {
    mockFetch({
      today: {
        ...TODAY,
        daily_checkin: { date: '2026-07-09', soreness: 4, energy: 4, mood: 5, soreness_note: null },
      },
    })
    renderWithProviders(<TodayView />)

    expect(await screen.findByRole('button', { name: /feeling great.*low soreness.*edit/i })).toBeInTheDocument()
  })

  it('does not render the check-in card on a past day without a check-in', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 6, 9, 12, 0))
    const yesterday = new Date(2026, 6, 8, 12, 0)
    mockFetch({ today: { ...TODAY, selected_date: '2026-07-08', activities: [], daily_checkin: null } })

    renderWithProviders(
      <DateContext.Provider value={{ selectedDate: yesterday, setSelectedDate: () => {} }}>
        <TodayView />
      </DateContext.Provider>,
    )

    await screen.findByRole('heading', { name: 'Body' })
    expect(screen.queryByRole('heading', { name: 'How do you feel today?' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })
})

function raceInfo(id: number, title: string): RaceInfo {
  return { id, title, date: `2026-08-0${id}`, distance_label: '10K', days_away: 20 + id, goal_time_sec: null, priority: 'B' }
}

describe('TodayView races', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('caps races at 2 and reveals the rest via "Show all N races"', async () => {
    const races = [raceInfo(1, 'Berlin Marathon'), raceInfo(2, 'Amsterdam Half'), raceInfo(3, 'Local 10K')]
    mockFetch({ today: { ...TODAY, next_races: races } })
    renderWithProviders(<TodayView />)

    await screen.findByText('Berlin Marathon')
    expect(screen.getByText('Amsterdam Half')).toBeInTheDocument()
    expect(screen.queryByText('Local 10K')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /show all 3 races/i }))

    expect(screen.getByText('Local 10K')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument()
  })

  it('always includes the season goal race with its days to go', async () => {
    const season: SeasonPlanResponse = {
      id: 1, generated_at: '2026-06-01T00:00:00Z', start_date: '2026-06-01', goal_race_title: 'Berlin Marathon',
      goal_race_date: '2099-09-27', goal_race_distance_m: 42195, peak_weekly_km: 90, weeks: [],
    }
    mockFetch({ season })
    renderWithProviders(<TodayView />)

    const row = (await screen.findByText('Berlin Marathon')).closest('li')!
    expect(row).toHaveTextContent('Goal race of the season')
    expect(screen.getByText('Spring 10K')).toBeInTheDocument()
  })
})
