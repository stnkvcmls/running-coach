import { useMemo } from 'react'
import { useSeasonPlan, useToday, useTrainingPlan } from '../api/hooks'
import type { RaceInfo, SeasonPlanResponse, TrainingPlanResponse } from '../api/types'
import { daysBetweenKeys, formatDateKey } from '../utils/date'

/** Where the athlete is in their training on a given day. Every field is
 * null when the data to derive it is missing. */
export interface TrainingContext {
  /** "Build", "Base", "Taper"… */
  phaseLabel: string | null
  /** 1-based week within the current block, and the block's length. */
  weekOfBlock: number | null
  blockWeeks: number | null
  goalRaceName: string | null
  /** Calendar days from the given date to the goal race (0 = race day). */
  daysToGoal: number | null
}

interface Block {
  phase: string | null
  week: number
  weeks: number
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function byWeekStart<T extends { week_start: string }>(weeks: T[]): T[] {
  return [...weeks].sort((a, b) => a.week_start.localeCompare(b.week_start))
}

/** The rolling training plan (what PlanView's week tabs show) — its phase and
 * the plan week containing the date. */
function trainingPlanBlock(plan: TrainingPlanResponse, dateKey: string): Block | null {
  const weeks = byWeekStart(plan.weeks)
  const index = weeks.findIndex(w => w.week_start <= dateKey && dateKey <= w.week_end)
  if (index < 0) return null
  return { phase: plan.phase, week: index + 1, weeks: weeks.length }
}

/** Season skeleton fallback: the run of consecutive same-phase weeks around
 * the date is the block. */
function seasonBlock(season: SeasonPlanResponse, dateKey: string): Block | null {
  const weeks = byWeekStart(season.weeks)
  const index = weeks.findIndex(w => {
    const offset = daysBetweenKeys(w.week_start, dateKey)
    return offset >= 0 && offset < 7
  })
  if (index < 0) return null
  const phase = weeks[index].phase
  let first = index
  while (first > 0 && weeks[first - 1].phase === phase) first--
  let last = index
  while (last < weeks.length - 1 && weeks[last + 1].phase === phase) last++
  return { phase, week: index - first + 1, weeks: last - first + 1 }
}

/** The season plan's goal race; failing that, the next A race, else the next race. */
function goalRace(
  season: SeasonPlanResponse | null,
  races: RaceInfo[],
  dateKey: string,
): { name: string; days: number } | null {
  if (season && season.goal_race_date >= dateKey) {
    return {
      name: season.goal_race_title || 'Goal race',
      days: daysBetweenKeys(dateKey, season.goal_race_date),
    }
  }
  const upcoming = races
    .filter(r => r.date >= dateKey)
    .sort((a, b) => a.date.localeCompare(b.date))
  const race = upcoming.find(r => r.priority === 'A') ?? upcoming[0]
  if (!race) return null
  return {
    name: race.title || race.distance_label || 'Race',
    days: daysBetweenKeys(dateKey, race.date),
  }
}

export function deriveTrainingContext({
  plan,
  season,
  races,
  dateKey,
}: {
  plan: TrainingPlanResponse | null
  season: SeasonPlanResponse | null
  races: RaceInfo[]
  dateKey: string
}): TrainingContext {
  // One source per block, never mixed: the training plan the athlete follows
  // day to day wins; the season skeleton covers dates outside it.
  const block = (plan && trainingPlanBlock(plan, dateKey)) ?? (season && seasonBlock(season, dateKey))
  const goal = goalRace(season, races, dateKey)
  return {
    phaseLabel: block?.phase ? capitalize(block.phase) : null,
    weekOfBlock: block?.week ?? null,
    blockWeeks: block?.weeks ?? null,
    goalRaceName: goal?.name ?? null,
    daysToGoal: goal?.days ?? null,
  }
}

/** "Build block, week 1 of 4" ("Week 1 of 4" with no phase); null when unknown. */
export function formatBlockLine(ctx: TrainingContext): string | null {
  if (ctx.weekOfBlock == null || ctx.blockWeeks == null) return null
  const week = `week ${ctx.weekOfBlock} of ${ctx.blockWeeks}`
  return ctx.phaseLabel ? `${ctx.phaseLabel} block, ${week}` : capitalize(week)
}

/** "Berlin Marathon in 90 days"; null when there's no upcoming goal race. */
export function formatGoalLine(ctx: TrainingContext): string | null {
  if (!ctx.goalRaceName || ctx.daysToGoal == null) return null
  if (ctx.daysToGoal === 0) return `${ctx.goalRaceName} today`
  if (ctx.daysToGoal === 1) return `${ctx.goalRaceName} tomorrow`
  return `${ctx.goalRaceName} in ${ctx.daysToGoal} days`
}

/** Training context for `date` (default: today, local), from the training
 * plan, the season plan and — only when the season plan names no upcoming
 * goal — the races on the /today payload (on Today that's TodayView's own
 * cached query, so no extra request). */
export function useTrainingContext(date: Date = new Date()): TrainingContext {
  const dateKey = formatDateKey(date)
  const { data: plan } = useTrainingPlan()
  const { data: season, isPending: seasonPending } = useSeasonPlan()
  const seasonNamesGoal = !!season && season.goal_race_date >= dateKey
  const { data: today } = useToday(dateKey, { enabled: !seasonPending && !seasonNamesGoal })
  const races = today?.next_races

  return useMemo(
    () => deriveTrainingContext({ plan: plan ?? null, season: season ?? null, races: races ?? [], dateKey }),
    [plan, season, races, dateKey],
  )
}
