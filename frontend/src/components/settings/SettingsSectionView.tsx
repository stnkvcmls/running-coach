import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import AiBackendSection from './AiBackendSection'
import AppearanceSection from './AppearanceSection'
import AthleteProfileSection from './AthleteProfileSection'
import CoachMemorySection from './CoachMemorySection'
import DataExportSection from './DataExportSection'
import DatabaseStatsSection from './DatabaseStatsSection'
import GarminConnectionSection from './GarminConnectionSection'
import ManualSyncSection from './ManualSyncSection'
import NotificationsSection from './NotificationsSection'
import SettingsPage from './SettingsPage'
import SystemHealthSection from './SystemHealthSection'
import ThresholdEstimateSection from './ThresholdEstimateSection'
import ZoneConfigSection from './ZoneConfigSection'

interface SubPage {
  title: string
  wide?: boolean
  content: ReactNode
}

/** /settings/:section — each index row opens one of these. The section
 * components are the same ones the old single-scroll Settings page stacked. */
const SETTINGS_PAGES: Record<string, SubPage> = {
  profile: { title: 'Athlete profile', content: <AthleteProfileSection /> },
  zones: {
    title: 'Zones and thresholds',
    wide: true,
    content: (
      <>
        <ThresholdEstimateSection />
        <ZoneConfigSection />
      </>
    ),
  },
  garmin: {
    title: 'Garmin Connect',
    content: (
      <>
        <GarminConnectionSection />
        <ManualSyncSection />
      </>
    ),
  },
  coach: {
    title: 'Coach',
    content: (
      <>
        <CoachMemorySection />
        <AiBackendSection />
      </>
    ),
  },
  notifications: { title: 'Notifications', content: <NotificationsSection /> },
  appearance: { title: 'Appearance', content: <AppearanceSection /> },
  data: {
    title: 'Data',
    content: (
      <>
        <DataExportSection />
        <DatabaseStatsSection />
        <SystemHealthSection />
      </>
    ),
  },
}

export default function SettingsSectionView() {
  const { section = '' } = useParams()
  const page = Object.prototype.hasOwnProperty.call(SETTINGS_PAGES, section) ? SETTINGS_PAGES[section] : undefined
  if (!page) return <Navigate to="/settings" replace />
  return (
    <SettingsPage title={page.title} backTo="/settings" wide={page.wide}>
      {page.content}
    </SettingsPage>
  )
}
