import { useZoneConfigs } from '../../api/hooks'
import type { ChartSeries } from '../../api/types'
import { effortZoneColor } from '../../utils/chartTheme'
import ZoneBar, { formatZoneTime, type ZoneSegment } from './ZoneBar'
import './PaceZonesChart.css'

interface Props {
  paceSeries: ChartSeries
  /** Moving time of the activity, to turn sample shares into minutes. */
  durationSec?: number | null
}

function formatPace(minPerKm: number): string {
  const min = Math.floor(minPerKm)
  const sec = Math.round((minPerKm - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

/** Time in (threshold-anchored) pace zone, drawn like the HR zones: one
 * stacked bar in the effort scale with the time printed under each zone. */
export default function PaceZonesChart({ paceSeries, durationSec }: Props) {
  const { data: zoneData, isLoading } = useZoneConfigs()

  if (isLoading || !zoneData) return null

  const threshold = zoneData.threshold_pace_min_km
  const zones = zoneData.pace

  if (!threshold || zones.length === 0) return null

  // Count samples per zone from the pace series (samples are evenly spaced in time).
  const counts = new Map<number, number>()
  for (const z of zones) counts.set(z.zone_number, 0)

  let total = 0
  for (const v of paceSeries.data) {
    if (v === null || v === undefined) continue
    total++
    for (const zone of zones) {
      const minPace = zone.min_pct !== null ? threshold * zone.min_pct / 100 : null
      const maxPace = zone.max_pct !== null ? threshold * zone.max_pct / 100 : null
      if ((minPace === null || v >= minPace) && (maxPace === null || v < maxPace)) {
        counts.set(zone.zone_number, (counts.get(zone.zone_number) ?? 0) + 1)
        break
      }
    }
  }

  if (total === 0) return null

  const segments: ZoneSegment[] = zones.map(z => {
    const share = (counts.get(z.zone_number) ?? 0) / total
    return {
      label: `Zone ${z.zone_number}`,
      // Z1–Z5 on the app's effort scale, not the colour stored in the zone config.
      color: effortZoneColor(z.zone_number),
      weight: share,
      value: durationSec ? formatZoneTime(share * durationSec) : `${Math.round(share * 100)}%`,
    }
  })

  if (segments.every(s => s.weight === 0)) return null

  const dominant = segments.reduce((max, s) => (s.weight > max.weight ? s : max), segments[0])

  return (
    <section className="detail-panel pace-zones-card">
      <div className="detail-panel-head">
        <h3 className="section-title">Time in pace zone</h3>
      </div>
      <ZoneBar
        segments={segments}
        ariaLabel={`Time in pace zone, based on threshold ${formatPace(threshold)} per km: ${segments.map(s => `${s.label} ${s.value}`).join(', ')}. Most time in ${dominant.label}.`}
      />
      <p className="pace-zones-note">Based on threshold {formatPace(threshold)} /km</p>
    </section>
  )
}
