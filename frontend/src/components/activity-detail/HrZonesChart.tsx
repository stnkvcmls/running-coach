import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './HrZonesChart.css'

const ZONE_COLORS = ['#2ecc71', '#27ae60', '#f39c12', '#e67e22', '#e74c3c']
const ZONE_LABELS = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5']

interface Props {
  zones: any
}

export default function HrZonesChart({ zones }: Props) {
  if (!zones || !Array.isArray(zones) || zones.length === 0) return null

  const data = zones.map((z: any, i: number) => {
    const secs = z?.secsInZone || z?.zoneLowBoundary || 0
    const mins = Math.round(secs / 60)
    return {
      zone: ZONE_LABELS[i] || `Zone ${i + 1}`,
      minutes: mins,
      seconds: secs,
    }
  })

  if (data.every((d: any) => d.minutes === 0)) return null

  return (
    <section className="detail-section">
      <h3 className="section-title">Heart Rate Zones</h3>
      <div className="card hr-zones-card">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="zone"
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid #2d2d44',
                borderRadius: 8,
                fontSize: 12,
                color: '#e0e0e0',
              }}
              formatter={(value: number) => [`${value} min`, 'Time']}
            />
            <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={20}>
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
