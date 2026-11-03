import type { WorkoutStep } from '../api/types'

/**
 * A session written the way a coach writes it ("6 × 800 m at 4:00 /km, 400 m
 * jog between"), derived from Garmin workout steps or parsed from a plan
 * day's free-text description. Pure functions only — see
 * docs/UI_UX_CRITIQUE.md §7 task 4.1.
 */

export type AmountUnit = 'm' | 'km' | 'mi' | 'min' | 's'

export interface Amount {
  value: number
  unit: AmountUnit
}

export interface RepStructure {
  reps: number
  work: Amount
  recovery: Amount | null
  /** "jog", "rest", "walk", "float"… as written; null when unknown. */
  recoveryKind: string | null
  /** Fastest target pace for a work rep, seconds per km. */
  paceSec: number | null
  warmupM: number | null
  cooldownM: number | null
}

const MILE_M = 1609.34

/** Metres for a distance amount; null for a time amount. */
export function amountMetres(a: Amount): number | null {
  if (a.unit === 'm') return a.value
  if (a.unit === 'km') return a.value * 1000
  if (a.unit === 'mi') return a.value * MILE_M
  return null
}

/** Seconds for a time amount; null for a distance amount. */
export function amountSeconds(a: Amount): number | null {
  if (a.unit === 's') return a.value
  if (a.unit === 'min') return a.value * 60
  return null
}

function trimNumber(n: number): string {
  return String(Math.round(n * 100) / 100)
}

/** "800 m", "1 km", "1.5 km", "1 mi", "10 min", "90 s". */
export function formatAmount(a: Amount): string {
  return `${trimNumber(a.value)} ${a.unit}`
}

/** Metres as an amount in the unit a coach would write: 800 m, 1.5 km. */
export function metresAmount(m: number): Amount {
  return m < 1000 ? { value: Math.round(m), unit: 'm' } : { value: Math.round(m / 10) / 100, unit: 'km' }
}

/** Seconds as an amount: whole minutes as min, otherwise seconds. */
export function secondsAmount(s: number): Amount {
  return s >= 60 && s % 60 === 0 ? { value: s / 60, unit: 'min' } : { value: Math.round(s), unit: 's' }
}

/** "4:05" → 245. */
export function parsePaceSec(text: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim())
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/** 245 → "4:05". */
export function formatPaceSec(sec: number): string {
  const s = Math.round(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Fastest m:ss pace in a display string ("4:25 - 4:35/km" → 265). */
export function fastestPaceIn(display: string | null | undefined): number | null {
  if (!display) return null
  const paces = Array.from(display.matchAll(/(\d{1,2}):(\d{2})/g), m => Number(m[1]) * 60 + Number(m[2]))
  const valid = paces.filter(p => p >= 120 && p <= 900)
  return valid.length > 0 ? Math.min(...valid) : null
}

function unitOf(raw: string | undefined, value: number): AmountUnit {
  const u = (raw ?? '').toLowerCase()
  if (u === 'km' || u === 'k') return 'km'
  if (u.startsWith('mi')) return u === 'min' || u === 'mins' || u === 'minute' || u === 'minutes' ? 'min' : 'mi'
  if (u.startsWith('min') || u === "'") return 'min'
  if (u === 's' || u.startsWith('sec') || u === '"') return 's'
  if (u === 'm' || u.startsWith('met')) return 'm'
  // Bare number: "8 x 400" means metres; "5 x 1" means kilometres.
  return value >= 100 ? 'm' : 'km'
}

const NUM = '(\\d+(?:[.,]\\d+)?)'
const UNIT = "(km|k|m|metres|meters|mi|miles?|mins?|minutes?|secs?|seconds?|s|'|\")?"

const REPS_RE = new RegExp(`(\\d{1,2})\\s*[x×X*]\\s*${NUM}\\s*${UNIT}(?![a-z])`, 'i')
const PACE_RE = /(?:@|\bat\b)\s*(\d{1,2}:\d{2})(?:\s*(?:-|–|to)\s*(\d{1,2}:\d{2}))?|(\d{1,2}:\d{2})(?:\s*(?:-|–|to)\s*(\d{1,2}:\d{2}))?\s*(?:\/\s*km|min\/km|per km)/i
const RECOVERY_AFTER_RE = new RegExp(`${NUM}\\s*${UNIT}\\s*(?:of\\s+)?(?:easy\\s+)?(jog|walk|rest|recovery|recoveries|float|standing rest)`, 'i')
const RECOVERY_BEFORE_RE = new RegExp(`(jog|walk|rest|recovery|float)\\s*(?:of\\s+)?${NUM}\\s*${UNIT}(?![a-z])`, 'i')
const WARMUP_RE = new RegExp(`${NUM}\\s*(km|k|m)\\s*(?:easy\\s+)?warm[\\s-]?up`, 'i')
const COOLDOWN_RE = new RegExp(`${NUM}\\s*(km|k|m)\\s*(?:easy\\s+)?cool[\\s-]?down`, 'i')

function num(raw: string): number {
  return Number(raw.replace(',', '.'))
}

function distanceMetres(rawValue: string, rawUnit: string): number {
  const v = num(rawValue)
  const u = rawUnit.toLowerCase()
  return u === 'm' ? v : v * 1000
}

function normaliseKind(raw: string): string {
  const k = raw.toLowerCase()
  if (k.startsWith('recover')) return 'recovery'
  if (k === 'standing rest') return 'rest'
  return k
}

/**
 * Parse a reps pattern out of free text ("6 x 800m @ 4:00/km w/ 400m jog",
 * "5×1 km at 3:55-4:00 /km, 90 s rest", "3 x 10 min tempo"). Returns null
 * when the text has no "N × amount" pattern.
 */
export function parseRepsFromText(text: string | null | undefined): RepStructure | null {
  if (!text) return null
  const reps = REPS_RE.exec(text)
  if (!reps) return null
  const count = Number(reps[1])
  const value = num(reps[2])
  if (count < 2 || value <= 0) return null
  const work: Amount = { value, unit: unitOf(reps[3], value) }

  const afterReps = text.slice(reps.index + reps[0].length)
  const pace = PACE_RE.exec(afterReps) ?? PACE_RE.exec(text)
  let paceSec: number | null = null
  if (pace) {
    const candidates = [pace[1], pace[2], pace[3], pace[4]]
      .filter((p): p is string => p != null)
      .map(parsePaceSec)
      .filter((p): p is number => p != null)
    paceSec = candidates.length > 0 ? Math.min(...candidates) : null
  }

  let recovery: Amount | null = null
  let recoveryKind: string | null = null
  const after = RECOVERY_AFTER_RE.exec(afterReps)
  const before = after ? null : RECOVERY_BEFORE_RE.exec(afterReps)
  if (after) {
    const v = num(after[1])
    recovery = { value: v, unit: unitOf(after[2], v) }
    recoveryKind = normaliseKind(after[3])
  } else if (before) {
    const v = num(before[2])
    recovery = { value: v, unit: unitOf(before[3], v) }
    recoveryKind = normaliseKind(before[1])
  }

  const wu = WARMUP_RE.exec(text)
  const cd = COOLDOWN_RE.exec(text)

  return {
    reps: count,
    work,
    recovery,
    recoveryKind,
    paceSec,
    warmupM: wu ? distanceMetres(wu[1], wu[2].toLowerCase() === 'k' ? 'km' : wu[2]) : null,
    cooldownM: cd ? distanceMetres(cd[1], cd[2].toLowerCase() === 'k' ? 'km' : cd[2]) : null,
  }
}

function isRecoverStep(step: WorkoutStep): boolean {
  return step.step_type === 'rest' || step.step_type === 'recovery' || step.activity_type === 'rest'
}

function isWorkStep(step: WorkoutStep): boolean {
  return step.step_type !== 'warmup' && step.step_type !== 'cooldown' && step.step_type !== 'repeat' && !isRecoverStep(step)
}

function stepAmount(step: WorkoutStep): Amount | null {
  const v = step.end_condition_value
  if (v == null || v <= 0) return null
  if (step.end_condition === 'distance') return metresAmount(v)
  if (step.end_condition === 'time') return secondsAmount(v)
  return null
}

function stepPace(step: WorkoutStep): number | null {
  if (step.target_type && step.target_type !== 'pace') return null
  return fastestPaceIn(step.target_display)
}

function flatten(steps: WorkoutStep[]): WorkoutStep[] {
  return steps.flatMap(s => (s.step_type === 'repeat' && s.steps ? flatten(s.steps) : [s]))
}

/** Fastest target pace across a workout's work steps (seconds per km). */
export function fastestWorkPaceSec(steps: WorkoutStep[] | null | undefined): number | null {
  if (!steps) return null
  const paces = flatten(steps).filter(isWorkStep).map(stepPace).filter((p): p is number => p != null)
  return paces.length > 0 ? Math.min(...paces) : null
}

/** The rep structure of a Garmin workout's first repeat block, or null when
 * the workout has none (a steady run). */
export function repsFromSteps(steps: WorkoutStep[] | null | undefined): RepStructure | null {
  if (!steps) return null
  const block = steps.find(s => s.step_type === 'repeat' && (s.repeat_count ?? 0) >= 2 && s.steps?.length)
  if (!block || !block.steps) return null
  const workStep = block.steps.find(isWorkStep)
  const work = workStep ? stepAmount(workStep) : null
  if (!workStep || !work) return null
  const recStep = block.steps.find(isRecoverStep)
  const warm = steps.find(s => s.step_type === 'warmup')
  const cool = steps.find(s => s.step_type === 'cooldown')
  const metres = (s: WorkoutStep | undefined) =>
    s && s.end_condition === 'distance' && s.end_condition_value ? s.end_condition_value : null
  return {
    reps: block.repeat_count!,
    work,
    recovery: recStep ? stepAmount(recStep) : null,
    recoveryKind: recStep ? (recStep.step_type === 'recovery' ? 'jog' : 'rest') : null,
    paceSec: stepPace(workStep) ?? fastestWorkPaceSec(steps),
    warmupM: metres(warm),
    cooldownM: metres(cool),
  }
}

/** "6 × 800 m". */
export function formatNotation(s: RepStructure): string {
  return `${s.reps} × ${formatAmount(s.work)}`
}

/** "at 4:00 /km, 400 m jog between" — null when there's nothing to add. */
export function formatSubline(s: RepStructure): string | null {
  const parts: string[] = []
  if (s.paceSec != null) parts.push(`at ${formatPaceSec(s.paceSec)} /km`)
  if (s.recovery) parts.push(`${formatAmount(s.recovery)} ${s.recoveryKind ?? 'recovery'} between`)
  return parts.length > 0 ? parts.join(', ') : null
}

function syntheticStep(order: number, type: string, amount: Amount | null): WorkoutStep {
  const m = amount ? amountMetres(amount) : null
  const sec = amount ? amountSeconds(amount) : null
  return {
    step_order: order,
    step_type: type,
    end_condition: m != null ? 'distance' : sec != null ? 'time' : null,
    end_condition_value: m ?? sec,
    end_condition_display: amount ? formatAmount(amount) : null,
    target_type: null,
    target_display: null,
    description: null,
    activity_type: type === 'rest' ? 'rest' : 'run',
    repeat_count: null,
    steps: null,
  }
}

/** Workout steps synthesised from a parsed structure, so a plan day with no
 * Garmin steps can still draw its structure bar. Warm-up/cool-down default
 * to splitting the remaining distance when the text names only the reps. */
export function stepsFromStructure(s: RepStructure, totalDistanceM: number | null): WorkoutStep[] {
  const workM = amountMetres(s.work)
  const recM = s.recovery ? amountMetres(s.recovery) : null
  let warm = s.warmupM
  let cool = s.cooldownM
  if ((warm == null || cool == null) && totalDistanceM != null && workM != null) {
    const used = s.reps * workM + (s.reps - 1) * (recM ?? 0)
    const rest = Math.max(totalDistanceM - used - (warm ?? 0) - (cool ?? 0), 0)
    if (warm == null && cool == null) {
      warm = rest / 2
      cool = rest / 2
    } else if (warm == null) warm = rest
    else cool = rest
  }
  const out: WorkoutStep[] = []
  let order = 1
  if (warm) out.push(syntheticStep(order++, 'warmup', metresAmount(warm)))
  for (let i = 0; i < s.reps; i++) {
    out.push(syntheticStep(order++, 'interval', s.work))
    if (s.recovery && i < s.reps - 1) out.push(syntheticStep(order++, 'rest', s.recovery))
  }
  if (cool) out.push(syntheticStep(order++, 'cooldown', metresAmount(cool)))
  return out
}

export interface SessionDescription {
  notation: string
  subline: string | null
  /** Steps for the structure bar (real or synthesised); null = no bar. */
  steps: WorkoutStep[] | null
  /** Key pace: the fastest work-step target, not the session average. */
  keyPaceSec: number | null
  structure: RepStructure | null
}

export interface SessionSource {
  label: string
  steps?: WorkoutStep[] | null
  texts?: (string | null | undefined)[]
  distanceM?: number | null
  /** Plan pace (min/km) — used as the key pace only for a steady session. */
  paceMinKm?: number | null
  paceDisplay?: string | null
}

/**
 * Notation source order (§7 4.1): Garmin `workout_steps` → a reps pattern in
 * the plan day's description/notes → "<Type> <distance> km".
 */
export function describeSession(src: SessionSource): SessionDescription {
  const fromSteps = repsFromSteps(src.steps)
  const fromText = fromSteps ? null : src.texts?.map(parseRepsFromText).find(s => s != null) ?? null
  const structure = fromSteps ?? fromText
  const steadyPace =
    fastestWorkPaceSec(src.steps) ??
    fastestPaceIn(src.paceDisplay) ??
    (src.paceMinKm ? Math.round(src.paceMinKm * 60) : null)

  if (structure) {
    const withPace = structure.paceSec == null && steadyPace != null ? { ...structure, paceSec: steadyPace } : structure
    return {
      notation: formatNotation(withPace),
      subline: formatSubline(withPace),
      steps: src.steps && src.steps.length > 0 ? src.steps : stepsFromStructure(withPace, src.distanceM ?? null),
      keyPaceSec: withPace.paceSec,
      structure: withPace,
    }
  }

  const km = src.distanceM ? `${trimNumber(src.distanceM / 1000)} km` : null
  return {
    notation: km ? `${src.label} ${km}` : src.label,
    subline: steadyPace != null ? `at ${formatPaceSec(steadyPace)} /km` : null,
    steps: src.steps && src.steps.length > 0 ? src.steps : null,
    keyPaceSec: steadyPace,
    structure: null,
  }
}
