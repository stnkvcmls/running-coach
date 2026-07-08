import { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useCustomChartMetrics, useCustomChartData } from '../../api/hooks'
import { useTheme } from '../../App'
import { getChartTickColor, getChartTooltipStyle } from '../../utils/theme'
import type { CustomChartMetric, CustomChartMetricGroup } from '../../api/types'
import './CustomChartsView.css'

type Days = 30 | 90 | 180 | 365

const DAY_OPTIONS: { label: string; value: Days }[] = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '180d', value: 180 },
  { label: '365d', value: 365 },
]

const GROUP_LABELS: Record<CustomChartMetricGroup, string> = {
  activity: 'Activity',
  wellness: 'Wellness',
  load: 'Training Load',
}

const GROUP_ORDER: CustomChartMetricGroup[] = ['activity', 'wellness', 'load']

const SERIES_COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3']

const MAX_METRICS = 4
const CONFIG_KEY = 'runningCoach.customChart.config'
const PRESETS_KEY = 'runningCoach.customChart.presets'

interface ChartConfig {
  metricIds: string[]
  days: Days
  compare?: boolean
}

interface ChartPreset extends ChartConfig {
  name: string
}

function loadConfig(): ChartConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.metricIds) && typeof parsed.days === 'number') {
        return { metricIds: parsed.metricIds, days: parsed.days }
      }
    }
  } catch {
    // ignore malformed localStorage state
  }
  return { metricIds: ['avg_pace', 'avg_hr'], days: 90 }
}

function loadPresets(): ChartPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore malformed localStorage state
  }
  return []
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function CustomChartsView() {
  const { data: metricsData, isLoading: metricsLoading } = useCustomChartMetrics()
  const [config, setConfig] = useState<ChartConfig>(loadConfig)
  const [presets, setPresets] = useState<ChartPreset[]>(loadPresets)
  const { theme } = useTheme()
  const tickColor = getChartTickColor(theme)
  const tooltipStyle = getChartTooltipStyle(theme)

  const { metricIds, days, compare = false } = config
  const { data: chartData, isLoading: dataLoading } = useCustomChartData(metricIds, days, compare)

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  }, [config])

  const metricsById = useMemo(() => {
    const map = new Map<string, CustomChartMetric>()
    for (const m of metricsData?.metrics ?? []) map.set(m.id, m)
    return map
  }, [metricsData])

  const groupedMetrics = useMemo(() => {
    const groups: Record<CustomChartMetricGroup, CustomChartMetric[]> = { activity: [], wellness: [], load: [] }
    for (const m of metricsData?.metrics ?? []) groups[m.group].push(m)
    return groups
  }, [metricsData])

  function toggleMetric(id: string) {
    setConfig(prev => {
      const selected = prev.metricIds.includes(id)
      if (selected) return { ...prev, metricIds: prev.metricIds.filter(m => m !== id) }
      if (prev.metricIds.length >= MAX_METRICS) return prev
      return { ...prev, metricIds: [...prev.metricIds, id] }
    })
  }

  function setDays(days: Days) {
    setConfig(prev => ({ ...prev, days }))
  }

  function toggleCompare() {
    setConfig(prev => ({ ...prev, compare: !prev.compare }))
  }

  function savePreset() {
    const name = window.prompt('Name this chart:')
    if (!name) return
    const next = [...presets.filter(p => p.name !== name), { name, metricIds, days }]
    setPresets(next)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next))
  }

  function loadPreset(name: string) {
    const preset = presets.find(p => p.name === name)
    if (preset) setConfig({ metricIds: preset.metricIds, days: preset.days })
  }

  function deletePreset(name: string) {
    const next = presets.filter(p => p.name !== name)
    setPresets(next)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next))
  }

  const isComparing = compare && !!chartData?.compare_points

  const rows = useMemo(() => {
    if (!isComparing) {
      return (chartData?.points ?? []).map(p => ({
        label: formatDate(p.date),
        ...p.values,
      }))
    }
    // Comparison mode: the current and previous periods cover different
    // calendar dates, so align rows by day_index (days since each period's
    // start) instead.
    const byIndex = new Map<number, Record<string, unknown>>()
    for (const p of chartData!.points) {
      byIndex.set(p.day_index, { label: `Day ${p.day_index + 1}`, dayIndex: p.day_index, ...p.values })
    }
    for (const p of chartData!.compare_points ?? []) {
      const row = byIndex.get(p.day_index) ?? { label: `Day ${p.day_index + 1}`, dayIndex: p.day_index }
      for (const [metricId, value] of Object.entries(p.values)) {
        row[`${metricId}__prev`] = value
      }
      byIndex.set(p.day_index, row)
    }
    return Array.from(byIndex.values()).sort((a: any, b: any) => a.dayIndex - b.dayIndex)
  }, [chartData, isComparing])

  if (metricsLoading) {
    return <div className="custom-chart-empty">Loading metrics…</div>
  }

  return (
    <div className="custom-chart-view">
      <div className="trends-header">
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Custom Chart</h2>
        <div className="trends-range-tabs">
          {DAY_OPTIONS.map(o => (
            <button
              key={o.value}
              className={`range-tab ${days === o.value ? 'active' : ''}`}
              onClick={() => setDays(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <label className="custom-chart-compare-toggle">
        <input type="checkbox" checked={compare} onChange={toggleCompare} />
        Compare to previous period
      </label>

      <div className="custom-chart-metric-picker">
        {GROUP_ORDER.map(group => (
          <div key={group} className="custom-chart-metric-group">
            <div className="custom-chart-group-label">{GROUP_LABELS[group]}</div>
            <div className="custom-chart-checkbox-list">
              {groupedMetrics[group].map(m => {
                const checked = metricIds.includes(m.id)
                const disabled = !checked && metricIds.length >= MAX_METRICS
                return (
                  <label key={m.id} className={`custom-chart-checkbox ${disabled ? 'disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleMetric(m.id)}
                    />
                    {m.label}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="custom-chart-presets">
        <button className="custom-chart-save-btn" onClick={savePreset} disabled={metricIds.length === 0}>
          Save as preset
        </button>
        {presets.map(p => (
          <span key={p.name} className="custom-chart-preset-chip">
            <button onClick={() => loadPreset(p.name)}>{p.name}</button>
            <button className="custom-chart-preset-remove" onClick={() => deletePreset(p.name)} aria-label={`Delete ${p.name}`}>
              ×
            </button>
          </span>
        ))}
      </div>

      {metricIds.length === 0 ? (
        <div className="custom-chart-empty">Select at least one metric to build a chart.</div>
      ) : dataLoading ? (
        <div className="custom-chart-empty">Loading chart…</div>
      ) : rows.length === 0 ? (
        <div className="custom-chart-empty">No data available for the selected metrics and range.</div>
      ) : (
        <div className="card custom-chart-card">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
              {metricIds.map((id, i) => (
                <YAxis
                  key={id}
                  yAxisId={id}
                  orientation={i % 2 === 0 ? 'left' : 'right'}
                  hide={i >= 2}
                  tick={{ fontSize: 11, fill: SERIES_COLORS[i % SERIES_COLORS.length] }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
              ))}
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string, item: any) => {
                  const baseId = (item.dataKey as string).replace(/__prev$/, '')
                  const m = metricsById.get(baseId)
                  return [`${value}${m?.unit ? ' ' + m.unit : ''}`, name]
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {metricIds.map((id, i) => (
                <Line
                  key={id}
                  dataKey={id}
                  yAxisId={id}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  name={metricsById.get(id)?.label ?? id}
                />
              ))}
              {isComparing && metricIds.map((id, i) => (
                <Line
                  key={`${id}__prev`}
                  dataKey={`${id}__prev`}
                  yAxisId={id}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  strokeOpacity={0.6}
                  dot={false}
                  connectNulls
                  name={`${metricsById.get(id)?.label ?? id} (previous)`}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
