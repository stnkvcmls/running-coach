import { useSettings } from '../../api/hooks'

export default function DatabaseStatsSection() {
  const { data, isLoading } = useSettings()

  if (isLoading) return null
  if (!data) return <div className="empty-state">Could not load database counts</div>

  return (
    <section className="settings-section">
      <h2 className="section-title">Database</h2>
      <div className="card stats-grid">
        {Object.entries(data.counts).map(([key, value]) => (
          <div key={key} className="settings-stat">
            <span className="stat-value">{value.toLocaleString()}</span>
            <span className="stat-label">{key.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
