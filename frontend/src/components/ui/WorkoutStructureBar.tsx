import { useState } from 'react'
import type { WorkoutStep } from '../../api/types'
import WorkoutSteps from '../today/WorkoutSteps'
import './WorkoutStructureBar.css'

export type StructureSegmentKind = 'warmup' | 'cooldown' | 'work' | 'recover'

export interface StructureSegment {
  kind: StructureSegmentKind
  weight: number
}

function segmentKind(step: WorkoutStep): StructureSegmentKind {
  if (step.step_type === 'warmup') return 'warmup'
  if (step.step_type === 'cooldown') return 'cooldown'
  if (step.step_type === 'rest' || step.activity_type === 'rest') return 'recover'
  return 'work'
}

function segmentWeight(step: WorkoutStep): number {
  return step.end_condition_value != null && step.end_condition_value > 0 ? step.end_condition_value : 1
}

/** Flatten workout steps into proportional bar segments, expanding repeat blocks
 * into their constituent steps (repeated `repeat_count` times). */
export function computeSegments(steps: WorkoutStep[]): StructureSegment[] {
  const out: StructureSegment[] = []
  for (const step of steps) {
    if (step.step_type === 'repeat' && step.steps && step.repeat_count) {
      for (let i = 0; i < step.repeat_count; i++) {
        out.push(...computeSegments(step.steps))
      }
    } else {
      out.push({ kind: segmentKind(step), weight: segmentWeight(step) })
    }
  }
  return out
}

const SEGMENT_COLORS: Record<StructureSegmentKind, string> = {
  warmup: 'var(--text-muted)',
  cooldown: 'var(--text-muted)',
  recover: 'var(--bg-hover)',
  work: 'var(--accent)',
}

interface Props {
  steps: WorkoutStep[]
  /** Accent for 'work' segments — pass the workout-type colour. Defaults to --accent. */
  color?: string
}

/** Proportional segment bar summarising a workout's warmup/work/recover/cooldown
 * shape. Tap/click reveals the full step-by-step breakdown (WorkoutSteps). */
export default function WorkoutStructureBar({ steps, color }: Props) {
  const [expanded, setExpanded] = useState(false)
  const segments = computeSegments(steps)
  if (segments.length === 0) return null

  return (
    <div className="workout-structure">
      <button
        type="button"
        className="workout-structure-bar"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={`Workout structure, ${segments.length} segments — tap for step-by-step breakdown`}
      >
        {segments.map((seg, i) => (
          <span
            key={i}
            className={`workout-structure-seg workout-structure-seg--${seg.kind}`}
            style={{ flex: seg.weight, background: seg.kind === 'work' && color ? color : SEGMENT_COLORS[seg.kind] }}
          />
        ))}
      </button>
      {expanded && (
        <div className="workout-structure-detail">
          <WorkoutSteps steps={steps} />
        </div>
      )}
    </div>
  )
}
