import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useTriggerSync } from '../../api/hooks'

export default function ManualSyncSection() {
  const syncMutation = useTriggerSync()
  return (
    <section className="settings-section">
      <h2 className="section-title">Manual sync</h2>
      <div className="sync-buttons">
        <SyncButton label="Sync activities" type="activities" mutation={syncMutation} />
        <SyncButton label="Sync daily summary" type="daily" mutation={syncMutation} />
        <SyncButton label="Sync calendar" type="calendar" mutation={syncMutation} />
      </div>
    </section>
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
      <RefreshCw size={16} className={syncing ? 'spin' : ''} />
      {syncing ? 'Syncing...' : label}
    </button>
  )
}
