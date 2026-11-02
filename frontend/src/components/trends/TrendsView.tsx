import { useState, type ComponentType, type ReactNode } from 'react'
import StatHelpButton from '../info/StatHelpButton'
import WellnessTrendsView from './WellnessTrendsView'
import PerformanceCurveView from './PerformanceCurveView'
import IntensityTrendsView from './IntensityTrendsView'
import AerobicTrendsView from './AerobicTrendsView'
import CustomChartsView from './CustomChartsView'
import PeakPerformancesView from './PeakPerformancesView'
import './TrendsView.css'

type Tab = 'body' | 'fitness' | 'records'

const TABS: { id: Tab; label: string }[] = [
  { id: 'body', label: 'Body' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'records', label: 'Records' },
]

/** Fitness stacks what used to be four separate tabs, each under a plain
 * heading; "Build a chart" (the old Custom tab) closes the page. */
const FITNESS_SECTIONS: { id: string; title: string; help?: ReactNode; View: ComponentType }[] = [
  {
    id: 'performance',
    title: 'Performance curve',
    help: <StatHelpButton topic="performance-curve" label="Performance curve" />,
    View: PerformanceCurveView,
  },
  { id: 'intensity', title: 'Intensity', View: IntensityTrendsView },
  { id: 'aerobic', title: 'Aerobic efficiency', View: AerobicTrendsView },
  { id: 'custom', title: 'Build a chart', View: CustomChartsView },
]

function FitnessPanel() {
  return (
    <div className="trends-fitness">
      {FITNESS_SECTIONS.map(({ id, title, help, View }) => (
        <section key={id} className="trends-section" aria-labelledby={`trends-section-${id}`}>
          <div className="section-title-row trends-section-head">
            <h2 id={`trends-section-${id}`} className="section-title">{title}</h2>
            {help}
          </div>
          <View />
        </section>
      ))}
    </div>
  )
}

export default function TrendsView() {
  const [tab, setTab] = useState<Tab>('body')

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
        {tab === 'body' && <WellnessTrendsView />}
        {tab === 'fitness' && <FitnessPanel />}
        {tab === 'records' && <PeakPerformancesView />}
      </div>
    </div>
  )
}
