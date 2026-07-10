import { useState } from 'react'
import WellnessTrendsView from './WellnessTrendsView'
import PerformanceCurveView from './PerformanceCurveView'
import IntensityTrendsView from './IntensityTrendsView'
import AerobicTrendsView from './AerobicTrendsView'
import CustomChartsView from './CustomChartsView'
import PeakPerformancesView from './PeakPerformancesView'
import './TrendsView.css'

type Tab = 'wellness' | 'performance' | 'intensity' | 'aerobic' | 'records' | 'custom'

const TABS: { id: Tab; label: string }[] = [
  { id: 'wellness', label: 'Wellness' },
  { id: 'performance', label: 'Performance' },
  { id: 'intensity', label: 'Intensity' },
  { id: 'aerobic', label: 'Aerobic' },
  { id: 'records', label: 'Records' },
  { id: 'custom', label: 'Custom' },
]

export default function TrendsView() {
  const [tab, setTab] = useState<Tab>('wellness')

  return (
    <div className="trends-page">
      <div className="trends-tabs" role="tablist" aria-label="Progress views">
        {TABS.map(t => (
          <button
            key={t.id}
            id={`trends-tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`trends-panel-${t.id}`}
            className={`chip ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        id={`trends-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`trends-tab-${tab}`}
      >
        {tab === 'wellness' && <WellnessTrendsView />}
        {tab === 'performance' && <PerformanceCurveView />}
        {tab === 'intensity' && <IntensityTrendsView />}
        {tab === 'aerobic' && <AerobicTrendsView />}
        {tab === 'records' && <PeakPerformancesView />}
        {tab === 'custom' && <CustomChartsView />}
      </div>
    </div>
  )
}
