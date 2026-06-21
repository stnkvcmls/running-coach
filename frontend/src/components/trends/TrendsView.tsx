import { useState } from 'react'
import WellnessTrendsView from './WellnessTrendsView'
import PerformanceCurveView from './PerformanceCurveView'
import IntensityTrendsView from './IntensityTrendsView'

type Tab = 'wellness' | 'intensity' | 'performance'

const TABS: { id: Tab; label: string }[] = [
  { id: 'wellness', label: 'Wellness' },
  { id: 'intensity', label: 'Intensity' },
  { id: 'performance', label: 'Performance' },
]

export default function TrendsView() {
  const [tab, setTab] = useState<Tab>('wellness')

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        background: 'var(--surface)',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: 'transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: tab === t.id ? 700 : 400,
              fontSize: '0.82rem',
              cursor: 'pointer',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'wellness' && <WellnessTrendsView />}
      {tab === 'intensity' && <IntensityTrendsView />}
      {tab === 'performance' && <PerformanceCurveView />}
    </div>
  )
}
