import { useState } from 'react'
import type { MetricZone } from '../../api/types'
import { effortZoneColor, getZoneColor, zoneIndexFor } from '../../utils/chartTheme'
import { formatPace } from '../../utils/formatting'
import LapsTable from './LapsTable'
import './SplitsBars.css'

interface Props {
  splits: any
  paceZones?: MetricZone[] | null
  color: string
}

const MIN_WIDTH_PCT = 35
const MAX_WIDTH_PCT = 100

function lapPaceMinKm(lap: any): number | null {
  const distance = lap.distance || lap.splitDistance
  const duration = lap.duration || lap.splitDuration || lap.totalTime
  return distance && duration ? (duration / 60) / (distance / 1000) : null
}

function lapHr(lap: any): number | null {
  const hr = lap.averageHR || lap.averageHeartRate
  return hr ? Math.round(hr) : null
}

export default function SplitsBars({ splits, paceZones, color }: Props) {
  const list = Array.isArray(splits) ? splits : []
  const [mode, setMode] = useState<'bars' | 'table'>(list.length >= 3 ? 'bars' : 'table')

  if (list.length === 0) return null

  const paces = list.map(lapPaceMinKm).filter((p): p is number => p != null)
  const minPace = paces.length ? Math.min(...paces) : 0 // fastest
  const maxPace = paces.length ? Math.max(...paces) : 0 // slowest

  function widthPct(pace: number | null): number {
    if (pace == null || maxPace === minPace) return MAX_WIDTH_PCT
    const t = (maxPace - pace) / (maxPace - minPace) // 1 = fastest, 0 = slowest
    return MIN_WIDTH_PCT + t * (MAX_WIDTH_PCT - MIN_WIDTH_PCT)
  }

  function barColor(pace: number | null): string {
    if (pace != null && paceZones && paceZones.length > 0) return getZoneColor(pace, paceZones)
    return color
  }

  const usedZones = paceZones && paceZones.length > 0
    ? paceZones
        .map((zone, index) => ({ zone, color: effortZoneColor(index + 1) }))
        .filter((_, index) => paces.some(p => zoneIndexFor(p, paceZones) === index))
    : []

  return (
    <section className="detail-panel splits-card">
      <div className="detail-panel-head">
        <h3 className="section-title">Splits</h3>
        <div className="seg-toggle" role="group" aria-label="Splits view">
          <button
            type="button"
            className={mode === 'bars' ? 'active' : ''}
            aria-pressed={mode === 'bars'}
            onClick={() => setMode('bars')}
          >
            Bars
          </button>
          <button
            type="button"
            className={mode === 'table' ? 'active' : ''}
            aria-pressed={mode === 'table'}
            onClick={() => setMode('table')}
          >
            Table
          </button>
        </div>
      </div>

      <div className={mode === 'table' ? 'splits-table' : undefined}>
        {mode === 'bars' ? (
          <>
            <div className="split-bars">
              {list.map((lap, i) => {
                const pace = lapPaceMinKm(lap)
                const hr = lapHr(lap)
                return (
                  <div className="split-row" key={i}>
                    <span className="split-km">{i + 1}</span>
                    <div className="split-track">
                      <div
                        className="split-bar"
                        style={{ width: `${widthPct(pace)}%`, background: barColor(pace) }}
                      />
                      <span className="split-val">{pace != null ? formatPace(pace) : '–'}</span>
                    </div>
                    {hr != null && <span className="split-hr">&hearts; {hr}</span>}
                  </div>
                )
              })}
            </div>
            {usedZones.length > 1 && (
              <div className="split-legend">
                {usedZones.map(({ zone, color }) => (
                  <span key={zone.zone_name}>
                    <i style={{ background: color }} />
                    {zone.zone_name}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <LapsTable splits={list} />
        )}
      </div>
    </section>
  )
}
