import { useState } from 'react'
import { useZoneConfigs, useUpdateZoneConfigs } from '../../api/hooks'
import type { ZoneConfig } from '../../api/types'
import './ZoneConfigSection.css'

function formatPace(minPerKm: number): string {
  const min = Math.floor(minPerKm)
  const sec = Math.round((minPerKm - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function formatBound(value: number | null, zoneType: string): string {
  if (value === null) return '—'
  if (zoneType === 'pace') return `${formatPace(value)}/km`
  if (zoneType === 'hr') return `${Math.round(value)} bpm`
  if (zoneType === 'power') return `${Math.round(value)} W`
  return String(value)
}

function zoneBoundLabel(zone: ZoneConfig, zoneType: string): string {
  const min = formatBound(zone.computed_min, zoneType)
  const max = formatBound(zone.computed_max, zoneType)
  if (zone.computed_min === null) return `< ${max}`
  if (zone.computed_max === null) return `> ${min}`
  return `${min} – ${max}`
}

function pctLabel(zone: ZoneConfig): string {
  const lo = zone.min_pct !== null ? `${zone.min_pct}%` : null
  const hi = zone.max_pct !== null ? `${zone.max_pct}%` : null
  if (lo === null) return `< ${hi}`
  if (hi === null) return `> ${lo}`
  return `${lo} – ${hi}`
}

interface ZoneEditorProps {
  title: string
  zoneType: string
  zones: ZoneConfig[]
  threshold: number | null
  thresholdLabel: string
  onSave: (zones: ZoneConfig[]) => void
  isPending: boolean
}

function ZoneTypeEditor({ title, zoneType, zones, threshold, thresholdLabel, onSave, isPending }: ZoneEditorProps) {
  const [draft, setDraft] = useState<ZoneConfig[]>(zones)
  const [dirty, setDirty] = useState(false)

  // Sync draft when parent zones change (after save)
  const [prevZones, setPrevZones] = useState(zones)
  if (zones !== prevZones) {
    setPrevZones(zones)
    setDraft(zones)
    setDirty(false)
  }

  const update = (idx: number, field: keyof ZoneConfig, value: string) => {
    setDraft(prev => {
      const next = [...prev]
      const zone = { ...next[idx] }
      if (field === 'zone_name') {
        zone.zone_name = value
      } else if (field === 'min_pct') {
        zone.min_pct = value === '' ? null : Number(value)
      } else if (field === 'max_pct') {
        zone.max_pct = value === '' ? null : Number(value)
      }
      next[idx] = zone
      return next
    })
    setDirty(true)
  }

  const handleSave = () => {
    onSave(draft)
    setDirty(false)
  }

  return (
    <div className="zone-type-editor">
      <div className="zone-type-header">
        <span className="zone-type-title">{title}</span>
        {threshold !== null ? (
          <span className="zone-type-threshold">Threshold: <strong>{thresholdLabel}</strong></span>
        ) : (
          <span className="zone-type-no-threshold">Set threshold in Athlete Profile to see computed values</span>
        )}
      </div>
      <div className="zone-table">
        <div className="zone-table-head">
          <span>Zone</span>
          <span>Name</span>
          <span>Min %</span>
          <span>Max %</span>
          {threshold !== null && <span>Range</span>}
        </div>
        {draft.map((zone, idx) => (
          <div key={zone.id} className="zone-row">
            <span className="zone-num" style={{ color: zone.zone_color }}>Z{zone.zone_number}</span>
            <input
              className="zone-name-input"
              type="text"
              value={zone.zone_name}
              onChange={e => update(idx, 'zone_name', e.target.value)}
            />
            <input
              className="zone-pct-input"
              type="number"
              step="0.1"
              min="0"
              value={zone.min_pct ?? ''}
              placeholder="—"
              onChange={e => update(idx, 'min_pct', e.target.value)}
            />
            <input
              className="zone-pct-input"
              type="number"
              step="0.1"
              min="0"
              value={zone.max_pct ?? ''}
              placeholder="—"
              onChange={e => update(idx, 'max_pct', e.target.value)}
            />
            {threshold !== null && (
              <span className="zone-computed">{zoneBoundLabel(zone, zoneType)}</span>
            )}
          </div>
        ))}
      </div>
      {dirty && (
        <button className="zone-save-btn" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save zones'}
        </button>
      )}
    </div>
  )
}

export default function ZoneConfigSection() {
  const { data, isLoading } = useZoneConfigs()
  const updateZones = useUpdateZoneConfigs()

  if (isLoading || !data) return null

  const handleSave = (updatedZones: ZoneConfig[]) => {
    updateZones.mutate({
      zones: updatedZones.map(z => ({
        zone_type: z.zone_type,
        zone_number: z.zone_number,
        zone_name: z.zone_name,
        min_pct: z.min_pct,
        max_pct: z.max_pct,
      })),
    })
  }

  const hrThresholdLabel = data.threshold_hr !== null ? `${data.threshold_hr} bpm` : null
  const paceThresholdLabel = data.threshold_pace_min_km !== null ? `${formatPace(data.threshold_pace_min_km)}/km` : null
  const powerThresholdLabel = data.threshold_power !== null ? `${data.threshold_power} W` : null

  return (
    <section className="settings-section">
      <h2 className="section-title">Training Zones</h2>
      <p className="zone-section-desc">
        Threshold-anchored zones for HR, pace, and power. Percentages are relative to your threshold
        values set in Athlete Profile.{' '}
        <em>For pace zones, higher % = slower pace (Zone 1 is easy, Zone 5 is fast).</em>
      </p>

      <div className="card zone-config-card">
        <ZoneTypeEditor
          title="Heart Rate Zones"
          zoneType="hr"
          zones={data.hr}
          threshold={data.threshold_hr}
          thresholdLabel={hrThresholdLabel ?? ''}
          onSave={handleSave}
          isPending={updateZones.isPending}
        />
      </div>

      <div className="card zone-config-card">
        <ZoneTypeEditor
          title="Pace Zones"
          zoneType="pace"
          zones={data.pace}
          threshold={data.threshold_pace_min_km}
          thresholdLabel={paceThresholdLabel ?? ''}
          onSave={handleSave}
          isPending={updateZones.isPending}
        />
      </div>

      <div className="card zone-config-card">
        <ZoneTypeEditor
          title="Power Zones (FTP)"
          zoneType="power"
          zones={data.power}
          threshold={data.threshold_power}
          thresholdLabel={powerThresholdLabel ?? ''}
          onSave={handleSave}
          isPending={updateZones.isPending}
        />
      </div>
    </section>
  )
}
