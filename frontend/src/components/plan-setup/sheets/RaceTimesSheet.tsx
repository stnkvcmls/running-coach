import { useState } from 'react'
import BottomSheet from '../BottomSheet'
import './Sheet.css'

interface RaceTime {
  key: string
  label: string
  abbr: string
}

const DISTANCES: RaceTime[] = [
  { key: 'marathon', label: 'Full marathon time', abbr: '42.2' },
  { key: 'half_marathon', label: 'Half marathon time', abbr: '21.1' },
  { key: '10k', label: '10 km time', abbr: '10K' },
  { key: '5k', label: '5 km time', abbr: '5K' },
]

function parseTime(t: string): { h: string; m: string; s: string } {
  const parts = t.split(':').map(p => p.padStart(2, '0'))
  if (parts.length === 3) return { h: parts[0], m: parts[1], s: parts[2] }
  if (parts.length === 2) return { h: '00', m: parts[0], s: parts[1] }
  return { h: '00', m: '00', s: '00' }
}

function formatTime(h: string, m: string, s: string): string {
  const hh = parseInt(h || '0', 10)
  const mm = parseInt(m || '0', 10)
  const ss = parseInt(s || '0', 10)
  if (hh > 0) return `${hh}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  return `${mm}:${String(ss).padStart(2,'0')}`
}

interface Props {
  open: boolean
  onClose: () => void
  initial: Record<string, string>
  onSave: (times: Record<string, string>) => void
}

export default function RaceTimesSheet({ open, onClose, initial, onSave }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [times, setTimes] = useState<Record<string, string>>(initial)
  const [fields, setFields] = useState<{ h: string; m: string; s: string }>({ h: '00', m: '00', s: '00' })

  function startEdit(key: string) {
    const t = times[key] ?? ''
    setFields(t ? parseTime(t) : { h: '00', m: '00', s: '00' })
    setEditing(key)
  }

  function commitEdit() {
    if (!editing) return
    const val = formatTime(fields.h, fields.m, fields.s)
    setTimes(prev => ({ ...prev, [editing]: val }))
    setEditing(null)
  }

  function clearTime(key: string) {
    setTimes(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  function handleSave() {
    onSave(times)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Current Race Times">
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.4 }}>
        Include a shorter and a longer distance time for more accurate paces in your plan.
      </p>
      <div className="sheet-time-cards">
        {DISTANCES.map(d => {
          const val = times[d.key]
          const isEditing = editing === d.key

          if (isEditing) {
            return (
              <div key={d.key} className="sheet-time-card sheet-time-card--filled" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="sheet-time-card-icon">{d.abbr}</div>
                  <span className="sheet-time-card-label">{d.label}</span>
                </div>
                <div className="sheet-time-input-row">
                  <input className="sheet-time-input" maxLength={2} value={fields.h} onChange={e => setFields(f => ({ ...f, h: e.target.value }))} placeholder="HH" />
                  <span>:</span>
                  <input className="sheet-time-input" maxLength={2} value={fields.m} onChange={e => setFields(f => ({ ...f, m: e.target.value }))} placeholder="MM" />
                  <span>:</span>
                  <input className="sheet-time-input" maxLength={2} value={fields.s} onChange={e => setFields(f => ({ ...f, s: e.target.value }))} placeholder="SS" />
                  <button onClick={commitEdit} style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' }}>OK</button>
                </div>
              </div>
            )
          }

          if (val) {
            return (
              <div key={d.key} className="sheet-time-card sheet-time-card--filled" onClick={() => startEdit(d.key)}>
                <div className="sheet-time-card-icon">{d.abbr}</div>
                <span className="sheet-time-card-label">{d.label}</span>
                <span className="sheet-time-card-value">{val}</span>
                <button
                  onClick={e => { e.stopPropagation(); clearTime(d.key) }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 4px' }}
                >✕</button>
              </div>
            )
          }

          return (
            <div key={d.key} className="sheet-time-card" onClick={() => startEdit(d.key)}>
              <div className="sheet-time-card-icon" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{d.abbr}</div>
              <span className="sheet-time-card-label">{d.label}</span>
              <span className="sheet-time-card-add">+</span>
            </div>
          )
        })}
      </div>
      <button className="sheet-save-btn" onClick={handleSave}>Save</button>
    </BottomSheet>
  )
}
