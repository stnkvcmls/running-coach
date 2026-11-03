import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import {
  useAiConfig,
  useAthleteProfile,
  useCoachMemories,
  useGarminStatus,
  useMe,
  useNotificationPreferences,
  useSyncStatus,
  useSystemHealth,
} from '../../api/hooks'
import { useTheme } from '../../App'
import SettingsPage from './SettingsPage'
import {
  appearanceSummary,
  garminSummary,
  healthSummary,
  memorySummary,
  notificationsSummary,
  profileSummary,
  thresholdsSummary,
  type RowValue,
} from './settingsSummary'

interface Row {
  label: string
  to: string
  value: string | RowValue | null
}

function SettingsGroup({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="set-group">
      <h2 className="set-group-title">{title}</h2>
      <ul className="set-list">
        {rows.map(row => {
          const value = typeof row.value === 'string' ? { text: row.value } : row.value
          return (
            <li key={row.label}>
              <Link to={row.to} className="set-row">
                <span className="set-row-label">{row.label}</span>
                {value && (
                  <span className={`set-row-value${value.tone ? ` set-row-value--${value.tone}` : ''}`}>
                    {value.text}
                  </span>
                )}
                <ChevronRight size={18} className="set-row-chevron" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** /settings — an index of groups; each row shows its current value and
 * opens a sub-page (/settings/:section, see SettingsSectionView). Values come
 * from the same queries the sub-page sections use, so they share the cache. */
export default function SettingsView() {
  const { data: me } = useMe()
  const { data: profile } = useAthleteProfile()
  const { data: garmin } = useGarminStatus()
  const { lastSyncedAt } = useSyncStatus()
  const { data: memories } = useCoachMemories()
  const { data: prefs } = useNotificationPreferences()
  const { data: ai } = useAiConfig()
  const { data: health } = useSystemHealth()
  const { preference } = useTheme()

  return (
    <SettingsPage title="Settings">
      <SettingsGroup
        title="You"
        rows={[
          { label: 'Athlete profile', to: '/settings/profile', value: profileSummary(profile) },
          { label: 'Zones and thresholds', to: '/settings/zones', value: thresholdsSummary(profile) },
        ]}
      />
      <SettingsGroup
        title="Connections"
        rows={[{ label: 'Garmin Connect', to: '/settings/garmin', value: garminSummary(garmin, lastSyncedAt) }]}
      />
      <SettingsGroup
        title="Coach"
        rows={[
          { label: 'What the coach remembers', to: '/settings/coach', value: memorySummary(memories) },
          { label: 'Notifications', to: '/settings/notifications', value: notificationsSummary(prefs) },
          { label: 'AI model', to: '/settings/coach', value: ai?.model ?? null },
        ]}
      />
      <SettingsGroup
        title="App"
        rows={[{ label: 'Appearance', to: '/settings/appearance', value: appearanceSummary(preference) }]}
      />
      <SettingsGroup
        title="Data"
        rows={[
          { label: 'Sync now', to: '/settings/garmin', value: 'Activities, health, calendar' },
          { label: 'Export', to: '/settings/data', value: 'CSV, JSON' },
          { label: 'System health', to: '/settings/data', value: healthSummary(health) },
        ]}
      />
      {me && <p className="settings-account-email">Signed in as {me.email}</p>}
    </SettingsPage>
  )
}
