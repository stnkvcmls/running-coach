import { describe, it, expect } from 'vitest'
import type { WorkoutStep } from '../api/types'
import {
  describeSession,
  fastestPaceIn,
  fastestWorkPaceSec,
  formatNotation,
  formatSubline,
  parseRepsFromText,
  repsFromSteps,
  stepsFromStructure,
} from './sessionNotation'

function step(overrides: Partial<WorkoutStep>): WorkoutStep {
  return {
    step_order: 1, step_type: 'interval', end_condition: null, end_condition_value: null,
    end_condition_display: null, target_type: null, target_display: null, description: null,
    activity_type: 'run', repeat_count: null, steps: null, ...overrides,
  }
}

const GARMIN_INTERVALS: WorkoutStep[] = [
  step({ step_type: 'warmup', end_condition: 'distance', end_condition_value: 1500 }),
  step({
    step_type: 'repeat', repeat_count: 6, steps: [
      step({ step_type: 'interval', end_condition: 'distance', end_condition_value: 800, target_type: 'pace', target_display: '3:55 - 4:05/km' }),
      step({ step_type: 'recovery', end_condition: 'distance', end_condition_value: 400, activity_type: 'rest' }),
    ],
  }),
  step({ step_type: 'cooldown', end_condition: 'distance', end_condition_value: 1000 }),
]

describe('parseRepsFromText', () => {
  it('reads reps, distance, pace and jog recovery', () => {
    const s = parseRepsFromText('6 x 800m @ 4:00/km with 400m jog recoveries')!
    expect(formatNotation(s)).toBe('6 × 800 m')
    expect(formatSubline(s)).toBe('at 4:00 /km, 400 m jog between')
  })

  it('handles ×, km reps, a pace range (fastest wins) and a timed rest', () => {
    const s = parseRepsFromText('Session: 5×1 km at 3:55-4:00 /km, 90 s rest')!
    expect(formatNotation(s)).toBe('5 × 1 km')
    expect(s.paceSec).toBe(235)
    expect(s.recovery).toEqual({ value: 90, unit: 's' })
    expect(s.recoveryKind).toBe('rest')
  })

  it('reads timed reps and minute recoveries', () => {
    const s = parseRepsFromText('3 x 10 min at threshold, 2 min jog')!
    expect(formatNotation(s)).toBe('3 × 10 min')
    expect(formatSubline(s)).toBe('2 min jog between')
  })

  it('treats a bare number as metres when large', () => {
    expect(formatNotation(parseRepsFromText('8x400 fast')!)).toBe('8 × 400 m')
  })

  it('picks up warm-up and cool-down distances', () => {
    const s = parseRepsFromText('1.5 km warm-up, 6 x 800 m, 1 km cool-down')!
    expect(s.warmupM).toBe(1500)
    expect(s.cooldownM).toBe(1000)
  })

  it('returns null without a reps pattern', () => {
    expect(parseRepsFromText('Easy aerobic run, keep it conversational')).toBeNull()
    expect(parseRepsFromText(null)).toBeNull()
  })
})

describe('Garmin steps', () => {
  it('reads the repeat block into a notation with the fastest work target', () => {
    const s = repsFromSteps(GARMIN_INTERVALS)!
    expect(formatNotation(s)).toBe('6 × 800 m')
    expect(s.paceSec).toBe(235)
    expect(formatSubline(s)).toBe('at 3:55 /km, 400 m jog between')
    expect(s.warmupM).toBe(1500)
  })

  it('returns null for a steady workout and finds its fastest pace', () => {
    const steady = [step({ end_condition: 'distance', end_condition_value: 6000, target_type: 'pace', target_display: '4:30 - 4:40/km' })]
    expect(repsFromSteps(steady)).toBeNull()
    expect(fastestWorkPaceSec(steady)).toBe(270)
  })

  it('fastestPaceIn ignores non-pace numbers', () => {
    expect(fastestPaceIn('4:25 - 4:35/km')).toBe(265)
    expect(fastestPaceIn(null)).toBeNull()
  })
})

describe('describeSession', () => {
  it('prefers Garmin steps over text', () => {
    const d = describeSession({ label: 'Intervals', steps: GARMIN_INTERVALS, texts: ['4 x 1 km'], distanceM: 9300 })
    expect(d.notation).toBe('6 × 800 m')
    expect(d.steps).toBe(GARMIN_INTERVALS)
    expect(d.keyPaceSec).toBe(235)
  })

  it('falls back to the description and synthesises bar steps', () => {
    const d = describeSession({ label: 'Intervals', texts: [null, '6 x 800m at 4:00/km, 400m jog'], distanceM: 9300, paceMinKm: 4.9 })
    expect(d.notation).toBe('6 × 800 m')
    expect(d.keyPaceSec).toBe(240) // rep pace, not the 4:54 session average
    const kinds = d.steps!.map(s => s.step_type)
    expect(kinds[0]).toBe('warmup')
    expect(kinds.filter(k => k === 'interval')).toHaveLength(6)
    expect(kinds.filter(k => k === 'rest')).toHaveLength(5)
    expect(kinds[kinds.length - 1]).toBe('cooldown')
  })

  it('falls back to type + distance with the plan pace', () => {
    const d = describeSession({ label: 'Easy', texts: ['Conversational'], distanceM: 9500, paceMinKm: 5.7 })
    expect(d.notation).toBe('Easy 9.5 km')
    expect(d.subline).toBe('at 5:42 /km')
    expect(d.steps).toBeNull()
  })
})

describe('stepsFromStructure', () => {
  it('splits leftover distance between warm-up and cool-down', () => {
    const s = parseRepsFromText('4 x 1 km')!
    const steps = stepsFromStructure(s, 8000)
    expect(steps[0]).toMatchObject({ step_type: 'warmup', end_condition_value: 2000 })
    expect(steps[steps.length - 1]).toMatchObject({ step_type: 'cooldown', end_condition_value: 2000 })
  })
})
