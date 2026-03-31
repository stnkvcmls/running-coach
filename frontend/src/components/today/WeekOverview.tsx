import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { WeeklyMileage } from '../../api/types'
import './WeekOverview.css'

interface Props {
  data: WeeklyMileage[]
}

// Consistent colors for activity types
const ACTIVITY_COLORS: Record<string, string> = {
  run: '#6c5ce7',    // Purple
  bike: '#00b894',   // Green
  swim: '#0984e3',   // Blue
  walk: '#fdcb6e',   // Yellow
  other: '#b2bec3',  // Gray
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

// Custom tooltip component
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)
    return (
      <div style={{
        background: '#1a1a2e',
        border: '1px solid #2d2d44',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: '#e0e0e0',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((entry, index) => {
          // Extract activity type from dataKey (e.g., "by_type.run" -> "run")
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
        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid #2d2d44', fontWeight: 600 }}>
          Total: {total.toFixed(1)} km
        </div>
      </div>
    )
  }
  return null
}

export default function WeekOverview({ data }: Props) {
  const maxKm = Math.max(...data.map(d => d.km), 1)
  const activityTypes = getActivityTypes(data)

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
              tick={{ fontSize: 11, fill: '#888' }}
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
                fill={ACTIVITY_COLORS[type]}
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
              <div className="legend-dot" style={{ backgroundColor: ACTIVITY_COLORS[type] }} />
              <span className="legend-label">{ACTIVITY_LABELS[type] || type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
