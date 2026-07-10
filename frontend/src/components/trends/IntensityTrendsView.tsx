import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useIntensityTrends } from '../../api/hooks'
import { useTheme } from '../../App'
import { getChartTickColor, getTooltipProps, INTENSITY_ZONE_COLORS, INTENSITY_BUCKET_COLORS, usePrefersReducedMotion } from '../../utils/chartTheme'
import RangeSelector, { DEFAULT_RANGE_OPTIONS, type RangeDays } from '../ui/RangeSelector'
import Skeleton from '../ui/Skeleton'
import type { IntensityWeek } from '../../api/types'

type ZoneType = 'hr' | 'power'

const ZONE_LABELS: Record<string, string> = {
  '1': 'Z1',
  '2': 'Z2',
  '3': 'Z3',
  '4': 'Z4',
  '5': 'Z5',
}

function formatMinutes(secs: number): string {
  const m = Math.round(secs / 60)
  return `${m}m`
}

function weekLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function buildChartData(weeks: IntensityWeek[]) {
  return weeks.map(w => {
    const row: Record<string, any> = { week: weekLabel(w.week_start) }
    for (const [zone, secs] of Object.entries(w.zone_seconds)) {
      row[`zone_${zone}`] = Math.round(secs / 60)
    }
    row._easy_pct = w.easy_pct
    row._moderate_pct = w.moderate_pct
    row._hard_pct = w.hard_pct
    row._total_min = Math.round(w.total_seconds / 60)
    return row
  })
}

function PolarizationBar({ easy, moderate, hard }: { easy: number; moderate: number; hard: number }) {
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      <div style={{ flex: easy, background: INTENSITY_BUCKET_COLORS.easy }} title={`Easy ${easy.toFixed(0)}%`} />
      <div style={{ flex: moderate, background: INTENSITY_BUCKET_COLORS.moderate }} title={`Moderate ${moderate.toFixed(0)}%`} />
      <div style={{ flex: hard, background: INTENSITY_BUCKET_COLORS.hard }} title={`Hard ${hard.toFixed(0)}%`} />
    </div>
  )
}

function IntensitySkeleton() {
  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', gap: 8 }}>
        <Skeleton height={30} width={180} radius="var(--radius-sm)" />
        <Skeleton height={26} width={80} radius="var(--radius-sm)" />
      </div>
      <div style={{ padding: '0 8px' }}>
        <div className="card" style={{ padding: '16px 8px 8px' }}>
          <Skeleton height={220} radius="var(--radius-xs)" />
        </div>
      </div>
    </div>
  )
}

export default function IntensityTrendsView() {
  const [days, setDays] = useState<RangeDays>(90)
  const [zoneType, setZoneType] = useState<ZoneType>('hr')
  const { data, isLoading } = useIntensityTrends(days, zoneType)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const { contentStyle } = getTooltipProps(theme)
  const reduceMotion = usePrefersReducedMotion()

  const allZones = ['1', '2', '3', '4', '5']

  if (isLoading) {
    return <IntensitySkeleton />
  }

  const weeks = data?.weeks ?? []

  if (weeks.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        No zone data available for this period. Sync activities with Garmin to populate zone data.
      </div>
    )
  }

  const chartData = buildChartData(weeks)

  // Average polarization across all weeks
  const weeksWithPolar = weeks.filter(w => w.easy_pct !== null)
  const avgEasy = weeksWithPolar.length
    ? weeksWithPolar.reduce((s, w) => s + (w.easy_pct ?? 0), 0) / weeksWithPolar.length
    : null
  const avgMod = weeksWithPolar.length
    ? weeksWithPolar.reduce((s, w) => s + (w.moderate_pct ?? 0), 0) / weeksWithPolar.length
    : null
  const avgHard = weeksWithPolar.length
    ? weeksWithPolar.reduce((s, w) => s + (w.hard_pct ?? 0), 0) / weeksWithPolar.length
    : null

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        gap: 8,
      }}>
        <RangeSelector options={DEFAULT_RANGE_OPTIONS} value={days} onChange={setDays} />
        <div style={{ display: 'flex', gap: 4 }}>
          {(['hr', 'power'] as ZoneType[]).map(zt => (
            <button
              key={zt}
              className={`chip ${zoneType === zt ? 'active' : ''}`}
              aria-pressed={zoneType === zt}
              onClick={() => setZoneType(zt)}
              style={{ textTransform: 'uppercase' }}
            >
              {zt}
            </button>
          ))}
        </div>
      </div>

      {/* Stacked bar chart */}
      <div style={{ padding: '0 8px' }}>
        <div className="card" style={{ padding: '16px 8px 8px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 8 }}>
            Weekly time in zone (minutes)
          </p>
          <div
            role="img"
            aria-label={`Weekly time in ${zoneType === 'hr' ? 'heart rate' : 'power'} zone, last ${days} days, ${weeks.length} weeks. Total ${formatMinutes(weeks.reduce((s, w) => s + w.total_seconds, 0))}.`}
          >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: tickColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={contentStyle}
                formatter={(value: number, name: string) => {
                  const zoneNum = name.replace('zone_', '')
                  const label = ZONE_LABELS[zoneNum] ?? name
                  return [`${value}m`, label]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                formatter={(value: string) => {
                  const zoneNum = value.replace('zone_', '')
                  return ZONE_LABELS[zoneNum] ?? value
                }}
              />
              {allZones.map(zone => (
                <Bar
                  key={zone}
                  dataKey={`zone_${zone}`}
                  stackId="zones"
                  fill={INTENSITY_ZONE_COLORS[zone]}
                  name={`zone_${zone}`}
                  isAnimationActive={!reduceMotion}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Polarization summary */}
      {avgEasy !== null && avgMod !== null && avgHard !== null && (
        <div style={{ padding: '12px 16px 0' }}>
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
              Average polarization
            </p>
            <PolarizationBar easy={avgEasy} moderate={avgMod} hard={avgHard} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem' }}>
              <span style={{ color: INTENSITY_BUCKET_COLORS.easy }}>Easy {avgEasy.toFixed(0)}%</span>
              <span style={{ color: INTENSITY_BUCKET_COLORS.moderate }}>Moderate {avgMod.toFixed(0)}%</span>
              <span style={{ color: INTENSITY_BUCKET_COLORS.hard }}>Hard {avgHard.toFixed(0)}%</span>
            </div>
            <p style={{
              fontSize: '0.73rem',
              color: 'var(--text-muted)',
              marginTop: 10,
              lineHeight: 1.4,
            }}>
              {avgEasy >= 75
                ? 'Well-polarized training — 80/20 distribution maintained.'
                : avgMod >= 30
                  ? 'Grey-zone heavy — consider shifting moderate volume to easy or hard.'
                  : 'High intensity bias — ensure adequate easy recovery volume.'}
            </p>
          </div>
        </div>
      )}

      {/* Per-week breakdown table */}
      <div style={{ padding: '12px 16px 0' }}>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Week</th>
                {allZones.map(z => (
                  <th key={z} style={{ textAlign: 'right', padding: '8px 8px', color: INTENSITY_ZONE_COLORS[z], fontWeight: 500 }}>
                    Z{z}
                  </th>
                ))}
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {weeks.slice().reverse().map(w => (
                <tr key={w.week_start} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '7px 12px', color: 'var(--text)' }}>{weekLabel(w.week_start)}</td>
                  {allZones.map(z => (
                    <td key={z} style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--text-muted)' }}>
                      {w.zone_seconds[z] ? formatMinutes(w.zone_seconds[z]) : '—'}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', padding: '7px 12px', color: 'var(--text)', fontWeight: 500 }}>
                    {formatMinutes(w.total_seconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
