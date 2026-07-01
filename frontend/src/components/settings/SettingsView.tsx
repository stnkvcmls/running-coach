import { useState } from 'react'
import { AlertTriangle, Download, RefreshCw, Watch } from 'lucide-react'
import {
  useSettings,
  useTriggerSync,
  useAiConfig,
  useSetAiConfig,
  useMe,
  useGarminStatus,
  useConnectGarmin,
  useSubmitGarminMfa,
  useDisconnectGarmin,
} from '../../api/hooks'
import AthleteProfileSection from './AthleteProfileSection'
import CoachMemorySection from './CoachMemorySection'
import ThresholdEstimateSection from './ThresholdEstimateSection'
import ZoneConfigSection from './ZoneConfigSection'
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

const EXPORT_LINKS = [
  { label: 'Activities CSV', url: '/api/v1/export/activities?format=csv', filename: 'activities.csv' },
  { label: 'Activities JSON', url: '/api/v1/export/activities?format=json', filename: 'activities.json' },
  { label: 'Insights CSV', url: '/api/v1/export/insights?format=csv', filename: 'insights.csv' },
  { label: 'Insights JSON', url: '/api/v1/export/insights?format=json', filename: 'insights.json' },
]

function DataExportSection() {
  return (
    <section className="settings-section">
      <h2 className="section-title">Data Export</h2>
      <div className="export-buttons">
        {EXPORT_LINKS.map(({ label, url, filename }) => (
          <a key={url} href={url} download={filename} className="sync-btn export-btn">
            <Download size={16} />
            {label}
          </a>
        ))}
      </div>
    </section>
  )
}

function AccountSection() {
  const { data } = useMe()
  if (!data) return null
  return (
    <section className="settings-section">
      <h2 className="section-title">Account</h2>
      <div className="card">
        <span className="settings-account-email">Signed in as {data.email}</span>
      </div>
    </section>
  )
}

function GarminConnectionSection() {
  const { data: status } = useGarminStatus()
  const connect = useConnectGarmin()
  const submitMfa = useSubmitGarminMfa()
  const disconnect = useDisconnectGarmin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [needsMfa, setNeedsMfa] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await connect.mutateAsync({ email, password })
      if (res.status === 'mfa_required') {
        setNeedsMfa(true)
      } else {
        setEmail('')
        setPassword('')
        setReconnecting(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await submitMfa.mutateAsync(mfaCode)
      setNeedsMfa(false)
      setMfaCode('')
      setEmail('')
      setPassword('')
      setReconnecting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA verification failed')
    }
  }

  const handleDisconnect = async () => {
    setError(null)
    try {
      await disconnect.mutateAsync()
      setNeedsMfa(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed')
    }
  }

  return (
    <section className="settings-section">
      <h2 className="section-title">Garmin Connection</h2>
      <div className="card garmin-connect">
        {status?.connected && !reconnecting ? (
          <div className="garmin-connected">
            <span className="garmin-status-line">
              <Watch size={16} /> Connected as {status.garmin_email}
            </span>
            {status.needs_reauth && (
              <div className="garmin-reauth">
                <span className="garmin-reauth-line">
                  <AlertTriangle size={16} /> Your Garmin session expired. Background
                  syncs are paused until you reconnect with a one-time code.
                </span>
                <button className="sync-btn" onClick={() => { setError(null); setReconnecting(true) }}>
                  Reconnect
                </button>
              </div>
            )}
            <button
              className="sync-btn garmin-disconnect"
              onClick={handleDisconnect}
              disabled={disconnect.isPending}
            >
              {disconnect.isPending ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ) : needsMfa ? (
          <form className="garmin-form" onSubmit={handleMfa}>
            <p className="garmin-hint">
              Enter the verification code Garmin just sent you.
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              autoComplete="one-time-code"
            />
            <button className="sync-btn" type="submit" disabled={submitMfa.isPending || !mfaCode}>
              {submitMfa.isPending ? 'Verifying…' : 'Verify code'}
            </button>
          </form>
        ) : (
          <form className="garmin-form" onSubmit={handleConnect}>
            <p className="garmin-hint">
              Connect your Garmin account to sync your activities and health data.
            </p>
            <input
              type="email"
              placeholder="Garmin email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Garmin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              className="sync-btn"
              type="submit"
              disabled={connect.isPending || !email || !password}
            >
              {connect.isPending ? 'Connecting…' : 'Connect Garmin'}
            </button>
          </form>
        )}
        {error && <span className="garmin-error">{error}</span>}
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
      {/* Signed-in account */}
      <AccountSection />

      {/* Garmin connection */}
      <GarminConnectionSection />

      {/* Athlete profile */}
      <AthleteProfileSection />

      {/* Coach memory */}
      <CoachMemorySection />

      {/* Auto-estimated thresholds */}
      <ThresholdEstimateSection />

      {/* Training zones */}
      <ZoneConfigSection />

      {/* AI backend selector */}
      <AiBackendSection />

      {/* Data export */}
      <DataExportSection />

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
