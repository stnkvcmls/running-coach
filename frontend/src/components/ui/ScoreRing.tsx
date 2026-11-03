import type { CSSProperties } from 'react'
import './ScoreRing.css'

interface Props {
  score: number
  /** Band colour — drawn on the ring stroke only. The number stays in
   * `--text` so it keeps body-text contrast whatever the band (a yellow
   * number on a light background was ~1.1:1). */
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
  return (
    <div className="score-ring" style={style}>
      <span className="score-ring-number">{score}</span>
      <span className="score-ring-sub">{subLabel}</span>
    </div>
  )
}
