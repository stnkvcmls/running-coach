import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { WeeklyMileage } from '../../api/types'
import './WeekOverview.css'

interface Props {
  data: WeeklyMileage[]
}

export default function WeekOverview({ data }: Props) {
  const maxKm = Math.max(...data.map(d => d.km), 1)

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
            <Tooltip
              cursor={{ fill: 'rgba(108, 92, 231, 0.1)' }}
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid #2d2d44',
                borderRadius: 8,
                fontSize: 12,
                color: '#e0e0e0',
              }}
              formatter={(value: number) => [`${value} km`, 'Distance']}
            />
            <Bar dataKey="km" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === data.length - 1 ? '#6c5ce7' : '#a29bfe'}
                  fillOpacity={i === data.length - 1 ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
