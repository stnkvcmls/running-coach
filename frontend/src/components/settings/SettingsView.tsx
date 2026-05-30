import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useSettings, useTriggerSync, useAiConfig, useSetAiConfig } from '../../api/hooks'
import AthleteProfileSection from './AthleteProfileSection'
import './SettingsView.css'

const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
}

function AiBackendSection() {
  const { data, isLoading } = useAiConfig()
  const setConfig = useSetAiConfig()

  if (isLoading || !data) return null

  const handleProviderChange = (provider: string) => {
    const firstModel = data.available_models[provider]?.[0] ?? ''
    setConfig.mutate({ provider, model: firstModel })
  }

  const handleModelChange = (model: string) => {
    setConfig.mutate({ provider: data.provider, model })
  }

  const isPending = setConfig.isPending

  return (
    <section className="settings-section">
      <h2 className="section-title">AI Backend</h2>
      <div className="card ai-config">
        <label className="ai-config-label">
          Provider
          <select
            value={data.provider}
            disabled={isPending}
            onChange={e => handleProviderChange(e.target.value)}
          >
            {data.available_providers.map(p => (
              <option key={p} value={p}>{PROVIDER_LABELS[p] ?? p}</option>
            ))}
          </select>
        </label>
        <label className="ai-config-label">
          Model
          <select
            value={data.model}
            disabled={isPending}
            onChange={e => handleModelChange(e.target.value)}
          >
            {(data.available_models[data.provider] ?? []).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        {setConfig.isError && (
          <span className="ai-config-error">Failed to save config</span>
        )}
      </div>
    </section>
  )
}

export default function SettingsView() {
  const { data, isLoading } = useSettings()
  const syncMutation = useTriggerSync()

  if (isLoading) return <div className="spinner" />
  if (!data) return <div className="empty-state">Could not load settings</div>

  return (
    <div className="settings-view">
      {/* Athlete profile */}
      <AthleteProfileSection />

      {/* AI backend selector */}
      <AiBackendSection />

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
