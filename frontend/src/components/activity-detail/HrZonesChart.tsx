import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from '../../App'
import { getChartTooltipStyle, getChartTickColor, getChartTooltipTextStyle } from '../../utils/theme'
import { usePrefersReducedMotion } from '../../utils/chartTheme'
import './HrZonesChart.css'

const ZONE_COLORS = ['#2ecc71', '#27ae60', '#f39c12', '#e67e22', '#e74c3c']
const ZONE_LABELS = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5']

interface Props {
  zones: any
}

export default function HrZonesChart({ zones }: Props) {
  const { theme } = useTheme()
  const reduceMotion = usePrefersReducedMotion()

  if (!zones || !Array.isArray(zones) || zones.length === 0) return null

  const data = zones.map((z: any, i: number) => {
    const secs = z?.secsInZone ?? 0
    const mins = Math.round(secs / 60)
    return {
      zone: ZONE_LABELS[i] || `Zone ${i + 1}`,
      minutes: mins,
      seconds: secs,
    }
  })

  if (data.every((d: any) => d.minutes === 0)) return null

  const totalMinutes = data.reduce((s: number, d: any) => s + d.minutes, 0)
  const dominant = data.reduce((max: any, d: any) => (d.minutes > max.minutes ? d : max), data[0])

  return (
    <section className="detail-section">
      <h3 className="section-title">Heart Rate Zones</h3>
      <div
        className="card hr-zones-card"
        role="img"
        aria-label={`Heart rate zones, ${totalMinutes} minutes total. Most time spent in ${dominant.zone}, ${dominant.minutes} minutes.`}
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="zone"
              tick={{ fontSize: 11, fill: getChartTickColor(theme) }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={getChartTooltipStyle(theme)}
              labelStyle={getChartTooltipTextStyle(theme)}
              itemStyle={getChartTooltipTextStyle(theme)}
              formatter={(value: number) => [`${value} min`, 'Time']}
            />
            <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={!reduceMotion}>
              {data.map((_: any, i: number) => (
                <Cell key={i} fill={ZONE_COLORS[i] || '#6c5ce7'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
