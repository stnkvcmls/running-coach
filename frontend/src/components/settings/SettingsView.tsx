import { useState } from 'react'
import { RefreshCw, Database, CloudDownload } from 'lucide-react'
import { useSettings, useTriggerSync } from '../../api/hooks'
import './SettingsView.css'

export default function SettingsView() {
  const { data, isLoading } = useSettings()
  const syncMutation = useTriggerSync()

  if (isLoading) return <div className="spinner" />
  if (!data) return <div className="empty-state">Could not load settings</div>

  return (
    <div className="settings-view">
      {/* Database stats */}
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

      {/* Sync status */}
      <section className="settings-section">
        <h2 className="section-title">Sync Status</h2>
        <div className="card sync-list">
          {Object.entries(data.sync_statuses).map(([key, status]) => (
            <div key={key} className="sync-item">
              <div className="sync-key">{key.replace(/_/g, ' ')}</div>
              <div className="sync-value">{status.value || '-'}</div>
              {status.updated_at && (
                <div className="sync-time">{new Date(status.updated_at).toLocaleString()}</div>
              )}
            </div>
          ))}
          {Object.keys(data.sync_statuses).length === 0 && (
            <div className="empty-state">No sync data yet</div>
          )}
        </div>
      </section>

      {/* Manual sync buttons */}
      <section className="settings-section">
        <h2 className="section-title">Manual Sync</h2>
        <div className="sync-buttons">
          <SyncButton
            label="Sync Activities"
            type="activities"
            mutation={syncMutation}
          />
          <SyncButton
            label="Sync Daily Summary"
            type="daily"
            mutation={syncMutation}
          />
          <SyncButton
            label="Sync Calendar"
            type="calendar"
            mutation={syncMutation}
          />
        </div>
      </section>
    </div>
  )
}

function SyncButton({ label, type, mutation }: { label: string; type: string; mutation: any }) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await mutation.mutateAsync(type)
    } catch {
      // ignore
    }
    setTimeout(() => setSyncing(false), 3000)
  }

  return (
    <button className="sync-btn" onClick={handleSync} disabled={syncing}>
      <RefreshCw size={16} className={syncing ? 'spin-icon' : ''} />
      {syncing ? 'Syncing...' : label}
    </button>
  )
}
