import { useState } from 'react'
import WellnessTrendsView from './WellnessTrendsView'
import PerformanceCurveView from './PerformanceCurveView'

type Tab = 'wellness' | 'performance'

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
        <button
          onClick={() => setTab('wellness')}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            background: 'transparent',
            color: tab === 'wellness' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: tab === 'wellness' ? 700 : 400,
            fontSize: '0.82rem',
            cursor: 'pointer',
            borderBottom: tab === 'wellness' ? '2px solid var(--accent)' : '2px solid transparent',
            fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
        >
          Wellness
        </button>
        <button
          onClick={() => setTab('performance')}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            background: 'transparent',
            color: tab === 'performance' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: tab === 'performance' ? 700 : 400,
            fontSize: '0.82rem',
            cursor: 'pointer',
            borderBottom: tab === 'performance' ? '2px solid var(--accent)' : '2px solid transparent',
            fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
        >
          Performance
        </button>
      </div>
      {tab === 'wellness' ? <WellnessTrendsView /> : <PerformanceCurveView />}
    </div>
  )
}
