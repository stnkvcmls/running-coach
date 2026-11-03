import { effortZoneColor } from '../../utils/chartTheme'
import ZoneBar, { formatZoneTime, type ZoneSegment } from './ZoneBar'

interface Props {
  zones: any
}

/** Time in heart-rate zone: one stacked bar, minutes printed per zone (D3). */
export default function HrZonesChart({ zones }: Props) {
  if (!zones || !Array.isArray(zones) || zones.length === 0) return null

  const segments: ZoneSegment[] = zones.slice(0, 5).map((z: any, i: number) => {
    const secs = Math.max(0, z?.secsInZone ?? 0)
    return { label: `Zone ${i + 1}`, color: effortZoneColor(i + 1), weight: secs, value: formatZoneTime(secs) }
  })

  const total = segments.reduce((s, z) => s + z.weight, 0)
  if (total < 60) return null
  const dominant = segments.reduce((max, z) => (z.weight > max.weight ? z : max), segments[0])

  return (
    <section className="detail-panel hr-zones-card">
      <div className="detail-panel-head">
        <h3 className="section-title">Time in zone</h3>
      </div>
      <ZoneBar
        segments={segments}
        ariaLabel={`Time in heart rate zone: ${segments.map(s => `${s.label} ${s.value}`).join(', ')}. Most time in ${dominant.label}.`}
      />
    </section>
  )
}
