import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { WeeklyMileage } from '../../api/types'
import { useTheme } from '../../App'
import { getAxisTick, getGridStroke, getTooltipProps } from '../../utils/chartTheme'
import { SPORT_COLORS } from '../../utils/colors'
import './WeekOverview.css'

interface Props {
  data: WeeklyMileage[]
}

const ACTIVITY_LABELS: Record<string, string> = {
  run: 'Run',
  bike: 'Bike',
  swim: 'Swim',
  walk: 'Walk',
  other: 'Other',
}

// Get all unique activity types from data
function getActivityTypes(data: WeeklyMileage[]): string[] {
  const types = new Set<string>()
  data.forEach(week => {
    Object.keys(week.by_type).forEach(type => types.add(type))
  })
  // Return in consistent order
  const orderedTypes = ['run', 'bike', 'swim', 'walk', 'other']
  return orderedTypes.filter(t => types.has(t))
}

export default function WeekOverview({ data }: Props) {
  const maxKm = Math.max(...data.map(d => d.km), 1)
  const activityTypes = getActivityTypes(data)
  const { theme } = useTheme()
  const { contentStyle } = getTooltipProps(theme)
  const borderColor = getGridStroke(theme)

  function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)
      return (
        <div style={{
          background: contentStyle.background,
          border: contentStyle.border,
          borderRadius: contentStyle.borderRadius,
          padding: '8px 12px',
          fontSize: 12,
          color: contentStyle.color,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
          {payload.map((entry, index) => {
            const activityType = entry.dataKey?.split('.').pop() || entry.dataKey
            return entry.value > 0 && (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: entry.color,
                }} />
                <span>{ACTIVITY_LABELS[activityType] || activityType}: {entry.value} km</span>
              </div>
            )
          })}
          <div style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${borderColor}`, fontWeight: 600 }}>
            Total: {total.toFixed(1)} km
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card week-overview">
      <div className="week-total">
        <span className="stat-value-lg">{data.reduce((s, d) => s + d.km, 0).toFixed(1)}</span>
        <span className="stat-unit">km total</span>
      </div>
      <div className="week-chart">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="label"
              tick={getAxisTick(theme, 11)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, maxKm * 1.15]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108, 92, 231, 0.1)' }} />
            {activityTypes.map((type, index) => (
              <Bar
                key={type}
                dataKey={`by_type.${type}`}
                name={ACTIVITY_LABELS[type] || type}
                stackId="a"
                fill={SPORT_COLORS[type as keyof typeof SPORT_COLORS]}
                radius={index === activityTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fillOpacity={i === data.length - 1 ? 1 : 0.7}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      {activityTypes.length > 0 && (
        <div className="week-legend">
          {activityTypes.map(type => (
            <div key={type} className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: SPORT_COLORS[type as keyof typeof SPORT_COLORS] }} />
              <span className="legend-label">{ACTIVITY_LABELS[type] || type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
