import type { TrainingPlanDay } from '../api/types'
import { formatDateKey } from './date'

export type PlanDayState = 'rest' | 'done' | 'missed' | 'today' | 'upcoming'

export function todayStr(): string {
  return formatDateKey(new Date())
}

/** Completion state for a plan day: rest days are always 'rest'; a day on or
 * before today is 'done' once a matching activity was found server-side
 * (matched_activity_id — the backend matches today's day too, as soon as the
 * run syncs); otherwise today is 'today' and an earlier day is 'missed';
 * anything later is 'upcoming'. `today` is injectable for deterministic
 * testing. */
export function dayState(day: TrainingPlanDay, today: string = todayStr()): PlanDayState {
  if (day.workout_type === 'rest') return 'rest'
  if (day.day_date === today) return day.matched_activity_id != null ? 'done' : 'today'
  if (day.day_date < today) return day.matched_activity_id != null ? 'done' : 'missed'
  return 'upcoming'
}
