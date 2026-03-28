import './StatGrid.css'

interface Stat {
  label: string
  value: string
  unit?: string
}

interface Props {
  stats: Stat[]
  columns?: number
  large?: boolean
}

export default function StatGrid({ stats, columns = 3, large = false }: Props) {
  return (
    <div className={`stat-grid card ${large ? 'stat-grid-large' : ''}`} style={{ gridTemplateColumns: `repeat(${Math.min(columns, stats.length)}, 1fr)` }}>
      {stats.map((s, i) => (
        <div key={i} className="stat-cell">
          <span className="stat-label">{s.label}</span>
          <span className={large ? 'stat-value-lg' : 'stat-value'}>
            {s.value}
            {s.unit && <span className="stat-unit">{s.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
