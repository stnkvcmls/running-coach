import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { useSystemHealth, useRetryJob } from '../../api/hooks'
import './SystemHealthSection.css'

const LAST_SYNC_LABELS: Record<string, string> = {
  activities: 'Activities',
  daily: 'Daily summary',
  profile: 'Athlete profile',
  calendar: 'Calendar',
}

function formatTimestamp(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'never'
}

function RetryButton({ jobId }: { jobId: number }) {
  const retry = useRetryJob()
  return (
    <button
      className="sync-btn health-retry-btn"
      onClick={() => retry.mutate(jobId)}
      disabled={retry.isPending}
    >
      <RefreshCw size={14} className={retry.isPending ? 'spin' : ''} />
      {retry.isPending ? 'Retrying…' : 'Retry'}
    </button>
  )
}

export default function SystemHealthSection() {
  const { data, isLoading } = useSystemHealth()

  if (isLoading || !data) return null

  const driftedSources = Object.entries(data.canary).filter(([, entry]) => !entry.ok)

  return (
    <section className="settings-section">
      <h2 className="section-title">System Health</h2>
      <div className="card health-card">
        <div className="health-subsection">
          <h3 className="health-subtitle">Last sync</h3>
          <div className="sync-list">
            {Object.entries(LAST_SYNC_LABELS).map(([key, label]) => (
              <div key={key} className="sync-item">
                <div className="sync-key">{label}</div>
                <div className="sync-value">{formatTimestamp(data.last_sync[key] ?? null)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="health-subsection">
          <h3 className="health-subtitle">Garmin API contract</h3>
          {data.canary_ok ? (
            <span className="health-status-line health-status-ok">
              <CheckCircle2 size={16} /> All contracts OK
            </span>
          ) : (
            <div className="health-canary-alarm">
              <span className="health-status-line health-status-alarm">
                <AlertTriangle size={16} /> Schema drift detected
              </span>
              <ul className="health-canary-list">
                {driftedSources.map(([source, entry]) => (
                  <li key={source}>
                    <strong>{source}</strong>: missing {entry.missing.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="health-subsection">
          <h3 className="health-subtitle">Failed background jobs</h3>
          {data.recent_failed_jobs.length === 0 ? (
            <p className="health-empty">No failed jobs.</p>
          ) : (
            <ul className="health-job-list">
              {data.recent_failed_jobs.map(job => (
                <li key={job.id} className="health-job-item">
                  <span className="health-job-body">
                    <strong>{job.task_type}</strong>
                    <span className="health-job-meta">
                      {job.attempts}/{job.max_attempts} attempts
                      {job.error_message ? ` — ${job.error_message}` : ''}
                    </span>
                  </span>
                  <RetryButton jobId={job.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
