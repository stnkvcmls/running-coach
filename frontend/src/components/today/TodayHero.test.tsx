import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import TodayHero from './TodayHero'
import type { ActivitySummary, TodayResponse, TrainingPlanDay, TrainingPlanResponse, WorkoutStep } from '../../api/types'

function today(overrides: Partial<TodayResponse> = {}): TodayResponse {
  return {
    selected_date: '2026-07-09',
    activities: [],
    daily_summary: null,
    weekly_data: [],
    insights: [],
    next_races: [],
    scheduled_events: [],
    training_load: null,
    readiness: null,
    plan_adaptation: null,
    daily_checkin: null,
    plan_day_id: null,
    briefing: null,
    ...overrides,
  }
}

function planDay(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 5,
    plan_id: 1,
    day_date: '2026-07-09',
    day_of_week: 'Thursday',
    week_number: 1,
    workout_type: 'tempo',
    target_distance_m: null,
    target_pace_min_km: null,
    target_pace_display: null,
    description: null,
    notes: null,
    week_theme: null,
    routine: null,
    fuelling_guidance: null,
    matched_activity_id: null,
    adherence_score: null,
    ...overrides,
  }
}

function trainingPlan(days: TrainingPlanDay[]): TrainingPlanResponse {
  return {
    id: 1,
    generated_at: '2026-07-06T00:00:00Z',
    week_start: '2026-07-06',
    plan_weeks: 4,
    phase: 'build',
    overview: null,
    weeks: [{ week_number: 1, week_start: '2026-07-06', week_end: '2026-07-12', theme: null, days }],
  }
}

function activity(overrides: Partial<ActivitySummary> = {}): ActivitySummary {
  return {
    id: 77,
    garmin_id: null,
    activity_type: 'running',
    name: 'Intervals',
    started_at: '2026-07-09T10:20:00',
    duration_sec: 2657,
    distance_m: 9220,
    avg_hr: 161,
    max_hr: 178,
    avg_pace_min_km: 4.8,
    calories: 700,
    elevation_gain: 20,
    workout_tag: 'Intervals',
    matched_plan_day_id: 5,
    ...overrides,
  }
}

/** The value cell next to a figure's label. */
function figure(label: string): string | null {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent ?? null
}

type Routes = Record<string, unknown>

/** Fetch mock: the first route whose key the URL contains wins. */
function mockFetch(routes: Routes) {
  const fn = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (init?.method === 'POST') return Promise.resolve({ ok: true, status: 200, json: async () => ({ status: 'queued', job_id: 0 }) })
    const key = Object.keys(routes).find(k => url.includes(k))
    const body = key ? routes[key] : {}
    return Promise.resolve({ ok: true, status: 200, json: async () => body })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

const INTERVAL_DAY = planDay({
  id: 5,
  workout_type: 'interval',
  target_distance_m: 9300,
  target_pace_min_km: 4.9,
  target_pace_display: '4:54/km',
  description: '6 x 800m @ 4:00/km with 400m jog recoveries',
})

describe('TodayHero, planned', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('writes the session as notation with a sub-line, figures and the rep (not average) pace', async () => {
    mockFetch({ '/training-plan': trainingPlan([INTERVAL_DAY]) })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5 })} />)

    expect(await screen.findByRole('heading', { name: '6 × 800 m' })).toBeInTheDocument()
    expect(screen.getByText('Intervals')).toBeInTheDocument()
    expect(screen.getByText('at 4:00 /km, 400 m jog between')).toBeInTheDocument()
    expect(figure('Rep pace')).toBe('4:00/km')
    expect(figure('Distance')).toBe('9.30km')
    expect(figure('Time')).toBe('≈46min')
    // The structure bar is drawn from the parsed description.
    expect(screen.getByRole('button', { name: /workout structure/i })).toBeInTheDocument()
  })

  it('prefers a scheduled Garmin workout\'s steps for the notation', async () => {
    const steps: WorkoutStep[] = [{
      step_order: 1, step_type: 'repeat', end_condition: null, end_condition_value: null, end_condition_display: null,
      target_type: null, target_display: null, description: null, activity_type: null, repeat_count: 5,
      steps: [{
        step_order: 1, step_type: 'interval', end_condition: 'distance', end_condition_value: 1000, end_condition_display: null,
        target_type: 'pace', target_display: '3:50 - 3:55/km', description: null, activity_type: 'run', repeat_count: null, steps: null,
      }],
    }]
    mockFetch({ '/training-plan': trainingPlan([INTERVAL_DAY]) })
    const event = {
      id: 4, event_type: 'workout', date: '2026-07-09', title: 'Intervals', distance_m: 9000, distance_label: null,
      goal_time_sec: null, priority: null, workout_type: 'interval', workout_description: null, workout_steps: steps, fuelling_guidance: null,
    }
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5, scheduled_events: [event] })} />)

    expect(await screen.findByRole('heading', { name: '5 × 1 km' })).toBeInTheDocument()
    expect(figure('Rep pace')).toBe('3:50/km')
  })

  it('falls back to type + distance for a steady run', async () => {
    mockFetch({ '/training-plan': trainingPlan([planDay({ workout_type: 'easy', target_distance_m: 9500, target_pace_min_km: 5.7 })]) })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5 })} />)

    expect(await screen.findByRole('heading', { name: 'Easy 9.5 km' })).toBeInTheDocument()
    expect(screen.getByText('Pace')).toBeInTheDocument()
  })

  it('has one primary action (Send to watch) and a quiet Change link to the plan', async () => {
    mockFetch({ '/training-plan': trainingPlan([INTERVAL_DAY]) })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5 })} />)

    expect(await screen.findByRole('button', { name: /send to watch/i })).toHaveClass('btn-primary')
    expect(screen.getByRole('link', { name: 'Change' })).toHaveAttribute('href', '/plan')
    expect(document.querySelectorAll('.btn-primary')).toHaveLength(1)
  })

  it('hides Send to watch for a cross-training day', async () => {
    mockFetch({ '/training-plan': trainingPlan([planDay({ workout_type: 'cross' })]) })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5 })} />)

    expect(await screen.findByRole('link', { name: 'Change' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send to watch/i })).not.toBeInTheDocument()
  })

  it('shows the briefing as one sentence and expands it in place', async () => {
    mockFetch({ '/training-plan': trainingPlan([INTERVAL_DAY]) })
    const briefing = {
      id: 1, created_at: null, trigger_type: 'briefing', trigger_id: 5, category: null, summary: null,
      content: 'Hold the reps at **4:00**. Stop after five if they drift past 4:10.',
    }
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5, briefing })} />)

    expect(await screen.findByText(/Hold the reps at 4:00\./)).toBeInTheDocument()
    expect(screen.queryByText(/Stop after five/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Full briefing' }))
    expect(screen.getByText(/Stop after five/)).toBeInTheDocument()
    expect(document.querySelector('.briefing-card')).toBeNull()
  })

  it('offers the generate action as a text link when there is no briefing yet', async () => {
    mockFetch({ '/training-plan': trainingPlan([INTERVAL_DAY]) })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5 })} />)

    const generate = await screen.findByRole('button', { name: 'Generate briefing' })
    expect(generate).not.toHaveClass('btn-primary')
  })

  it('rest: says "Rest day" with no actions', async () => {
    mockFetch({ '/training-plan': trainingPlan([planDay({ id: 9, workout_type: 'rest' })]) })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 9 })} />)

    expect(await screen.findByText('Rest day')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send to watch/i })).not.toBeInTheDocument()
  })

  it('no plan: links to /plan to set one up', async () => {
    mockFetch({ '/training-plan': null })
    renderWithProviders(<TodayHero data={today()} />)

    expect(await screen.findByRole('link', { name: /set up a plan/i })).toHaveAttribute('href', '/plan')
  })

  it('no session today: links to /chat when a plan exists but nothing is scheduled', async () => {
    mockFetch({ '/training-plan': trainingPlan([planDay({ id: 1, day_date: '2026-07-06' })]) })
    renderWithProviders(<TodayHero data={today()} />)

    expect(await screen.findByRole('link', { name: /ask your coach/i })).toHaveAttribute('href', '/chat')
  })
})

describe('TodayHero, readiness line', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows score, word and the limiting factor, and toggles the breakdown', async () => {
    mockFetch({ '/training-plan': null })
    const data = today({
      readiness: {
        score: 55, label: 'Good', sleep_component: 40, recovery_component: 70, fatigue_component: 80,
        rhr_component: 75, hrv_component: 60, subjective_component: null,
      },
    })
    renderWithProviders(<TodayHero data={data} />)

    const line = screen.getByRole('button', { name: /readiness 55 out of 100, good/i })
    expect(line).toHaveTextContent('Short sleep is holding it back.')
    expect(line).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(line)
    expect(line).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Freshness')).toBeInTheDocument()
  })
})

describe('TodayHero, done', () => {
  afterEach(() => vi.unstubAllGlobals())

  const DETAIL = {
    id: 77,
    rpe: null,
    feedback_rating: null,
    feedback_tags: null,
    feedback_text: null,
    scheduled_workout: null,
    adherence: {
      adherence_score: 100,
      intervals: [
        { step_type: 'warmup', matched: true, actual_pace_display: '5:30/km', planned_pace_display: null },
        ...['4:02', '3:58', '4:01', '3:59', '4:03', '4:05'].map(p => ({
          step_type: 'interval', matched: true, actual_pace_display: `${p}/km`, planned_pace_display: '3:55 - 4:05/km',
        })),
      ],
    },
  }

  it('turns into the result: done time, notation, verdict, rep chart, figures', async () => {
    mockFetch({
      '/training-plan': trainingPlan([{ ...INTERVAL_DAY, matched_activity_id: 77, adherence_score: 61 }]),
      '/activities/77': DETAIL,
    })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5, activities: [activity()] })} />)

    expect(screen.getByText('Done at 10:20')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '6 × 800 m' })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /rep paces against a 4:00 target: 4:02, 3:58, 4:01, 3:59, 4:03, 4:05/i })).toBeInTheDocument()
    expect(screen.getByText(/All six reps within 5 s of 4:00\. The last one was the slowest\./)).toBeInTheDocument()
    // Adherence comes from the plan day (61 %), not the activity's own 100 %.
    expect(screen.getByText(/61% adherence to the plan/)).toBeInTheDocument()
    expect(screen.queryByText(/100%/)).not.toBeInTheDocument()
    expect(figure('Avg HR')).toBe('161bpm')
    expect(screen.getByRole('link', { name: 'Open run analysis' })).toHaveAttribute('href', '/activities/77')
    expect(screen.queryByRole('button', { name: /send to watch/i })).not.toBeInTheDocument()
  })

  it('hides the rep chart for an unstructured session', async () => {
    mockFetch({
      '/training-plan': trainingPlan([planDay({ workout_type: 'easy', target_distance_m: 8000, matched_activity_id: 77 })]),
      '/activities/77': { ...DETAIL, adherence: { adherence_score: 90, intervals: null } },
    })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5, activities: [activity({ workout_tag: 'Easy Run' })] })} />)

    expect(await screen.findByText('How hard did it feel?')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /rep paces/i })).not.toBeInTheDocument()
  })

  it('asks for RPE inline and posts it through the feedback mutation', async () => {
    const fetchMock = mockFetch({
      '/training-plan': trainingPlan([INTERVAL_DAY]),
      '/activities/77': DETAIL,
    })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5, activities: [activity()] })} />)

    fireEvent.click(await screen.findByRole('button', { name: '7 of 10' }))
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/activities/77/feedback',
        expect.objectContaining({ method: 'POST', body: expect.stringContaining('"rpe":7') }),
      ),
    )
  })

  it('shows "Felt N/10" once rated', async () => {
    mockFetch({ '/training-plan': trainingPlan([INTERVAL_DAY]), '/activities/77': { ...DETAIL, rpe: 8 } })
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5, activities: [activity()] })} />)

    expect(await screen.findByText(/Felt/)).toHaveTextContent('Felt 8/10')
    expect(screen.queryByText('How hard did it feel?')).not.toBeInTheDocument()
  })
})
