import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useZoneConfigs } from '../../api/hooks'
import type { ChartSeries } from '../../api/types'
import { useTheme } from '../../App'
import { getChartTooltipStyle, getChartTickColor, getChartTooltipTextStyle } from '../../utils/theme'
import { usePrefersReducedMotion } from '../../utils/chartTheme'
import './PaceZonesChart.css'

interface Props {
  paceSeries: ChartSeries
}

function formatPace(minPerKm: number): string {
  const min = Math.floor(minPerKm)
  const sec = Math.round((minPerKm - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export default function PaceZonesChart({ paceSeries }: Props) {
  const { data: zoneData, isLoading } = useZoneConfigs()
  const { theme } = useTheme()
  const reduceMotion = usePrefersReducedMotion()

  if (isLoading || !zoneData) return null

  const threshold = zoneData.threshold_pace_min_km
  const zones = zoneData.pace

  if (!threshold || zones.length === 0) return null

  // Count samples per zone from the pace series
  const counts = new Map<number, number>()
  for (const z of zones) counts.set(z.zone_number, 0)

  let total = 0
  for (const v of paceSeries.data) {
    if (v === null || v === undefined) continue
    let classified = false
    for (const zone of zones) {
      const minPace = zone.min_pct !== null ? threshold * zone.min_pct / 100 : null
      const maxPace = zone.max_pct !== null ? threshold * zone.max_pct / 100 : null
      const aboveMin = minPace === null || v >= minPace
      const belowMax = maxPace === null || v < maxPace
      if (aboveMin && belowMax) {
        counts.set(zone.zone_number, (counts.get(zone.zone_number) ?? 0) + 1)
        total++
        classified = true
        break
      }
    }
    if (!classified) {
      // Assign to nearest boundary zone
      total++
    }
  }

  if (total === 0) return null

  const chartData = zones.map(z => {
    const count = counts.get(z.zone_number) ?? 0
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    const minPace = z.min_pct !== null ? threshold * z.min_pct / 100 : null
    const maxPace = z.max_pct !== null ? threshold * z.max_pct / 100 : null
    let rangeLabel = ''
    if (minPace === null) rangeLabel = `< ${formatPace(maxPace!)} /km`
    else if (maxPace === null) rangeLabel = `> ${formatPace(minPace)} /km`
    else rangeLabel = `${formatPace(minPace)} – ${formatPace(maxPace)} /km`
    return {
      zone: `Z${z.zone_number}: ${z.zone_name}`,
      pct,
      color: z.zone_color,
      rangeLabel,
    }
  })

  // Only show if there's meaningful data
  if (chartData.every(d => d.pct === 0)) return null

  const dominant = chartData.reduce((max, d) => (d.pct > max.pct ? d : max), chartData[0])

  return (
    <section className="detail-section">
      <h3 className="section-title">Pace Zones</h3>
      <div
        className="card pace-zones-card"
        role="img"
        aria-label={`Pace zones based on threshold ${formatPace(threshold)} per km. Most time spent in ${dominant.zone}, ${dominant.pct}%.`}
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="zone"
              tick={{ fontSize: 11, fill: getChartTickColor(theme) }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={getChartTooltipStyle(theme)}
              labelStyle={getChartTooltipTextStyle(theme)}
              itemStyle={getChartTooltipTextStyle(theme)}
              formatter={(value: number, _name: string, props: any) => [
                `${value}% (${props.payload.rangeLabel})`,
                'Time',
              ]}
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={!reduceMotion}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="pace-zones-note">Based on threshold {formatPace(threshold)}/km</p>
      </div>
    </section>
  )
}
