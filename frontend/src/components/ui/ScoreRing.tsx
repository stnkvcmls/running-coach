import type { CSSProperties } from 'react'
import Numeral from './Numeral'
import './ScoreRing.css'

interface Props {
  score: number
  color: string
  size?: number
  /** Text under the score, e.g. "/100" or a short qualitative word. Defaults to "/100". */
  subLabel?: string
}

export default function ScoreRing({ score, color, size = 72, subLabel = '/100' }: Props) {
  const style: CSSProperties = {
    '--ring-color': color,
    width: size,
    height: size,
  } as CSSProperties
  const progress = Math.max(0, Math.min(100, score))
  // DotMatrix renders at a fixed pixel size by default — scale it down with
  // the ring so a 2-3 digit score never outgrows the circle it sits in
  // (Numeral/DotMatrix's own default is sized for looser contexts like
  // StatGrid cells, not a tight circular one).
  const numeralDot = Math.max(1.3, size * 0.021)
  const numeralGap = numeralDot * 0.6

  return (
    <div className="score-ring" style={style}>
      <svg className="score-ring-svg" viewBox="0 0 96 96" width={size} height={size} aria-hidden="true">
        <circle
          className="score-ring-arc"
          cx="48"
          cy="48"
          r="42"
          fill="none"
          stroke="var(--border)"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={100}
        />
        <circle
          className="score-ring-arc"
          cx="48"
          cy="48"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={100}
          style={{ strokeDasharray: `${progress} 100` }}
        />
      </svg>
      <div className="score-ring-center">
        <span className="score-ring-number" style={{ color }}>
          <Numeral value={String(Math.round(score))} dot={numeralDot} gap={numeralGap} />
        </span>
        <span className="score-ring-sub">{subLabel}</span>
      </div>
    </div>
  )
}
