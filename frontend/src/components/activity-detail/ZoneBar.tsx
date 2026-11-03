import type { CSSProperties } from 'react'
import './ZoneBar.css'

export interface ZoneSegment {
  /** "Zone 1" */
  label: string
  /** Effort colour, a var(--z*) reference. */
  color: string
  /** Relative share (seconds, samples...); only proportions matter. */
  weight: number
  /** Figure printed under the bar, e.g. "6:10". */
  value: string
}

/** Time in zone as one 100% stacked bar in the effort scale, with the figure
 * for every zone printed beneath it rather than hidden in a tooltip (D3). */
export default function ZoneBar({ segments, ariaLabel }: { segments: ZoneSegment[]; ariaLabel: string }) {
  return (
    <div className="zone-bar-wrap" role="img" aria-label={ariaLabel}>
      <div className="zone-bar" aria-hidden="true">
        {segments.filter(s => s.weight > 0).map(s => (
          <span key={s.label} style={{ flexGrow: s.weight, '--c': s.color } as CSSProperties} />
        ))}
      </div>
      <div className="zone-legend" aria-hidden="true" style={{ '--zones': segments.length } as CSSProperties}>
        {segments.map(s => (
          <div key={s.label} style={{ '--c': s.color } as CSSProperties}>
            <b className="num">{s.value}</b>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Seconds as m:ss ("6:10"), or h:mm:ss past an hour. */
export function formatZoneTime(seconds: number): string {
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}
