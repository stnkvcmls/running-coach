import { useState } from 'react'
import { AlertTriangle, Watch } from 'lucide-react'
import {
  useGarminStatus,
  useConnectGarmin,
  useSubmitGarminMfa,
  useDisconnectGarmin,
} from '../../api/hooks'

export default function GarminConnectionSection() {
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
      <h2 className="section-title">Garmin connection</h2>
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
