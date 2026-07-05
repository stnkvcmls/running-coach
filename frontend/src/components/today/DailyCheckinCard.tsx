import { useEffect, useState } from 'react'
import { useSubmitDailyCheckin } from '../../api/hooks'
import type { DailyCheckin } from '../../api/types'
import './DailyCheckinCard.css'

interface Props {
  date: string
  checkin: DailyCheckin | null
}

const SCALE = [1, 2, 3, 4, 5]

function TapRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="checkin-row">
      <div className="checkin-row-label">
        <span>{label}</span>
        <span className="checkin-row-hint">{hint}</span>
      </div>
      <div className="checkin-row-taps">
        {SCALE.map(v => (
          <button
            key={v}
            type="button"
            className={`checkin-tap ${value === v ? 'checkin-tap--selected' : ''}`}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DailyCheckinCard({ date, checkin }: Props) {
  const [editing, setEditing] = useState(!checkin)
  const [dismissed, setDismissed] = useState(false)
  const [soreness, setSoreness] = useState<number | null>(checkin?.soreness ?? null)
  const [energy, setEnergy] = useState<number | null>(checkin?.energy ?? null)
  const [mood, setMood] = useState<number | null>(checkin?.mood ?? null)
  const [sorenessNote, setSorenessNote] = useState(checkin?.soreness_note ?? '')
  const submitCheckin = useSubmitDailyCheckin()

  // Reset local state when the viewed date (or its check-in) changes.
  useEffect(() => {
    setSoreness(checkin?.soreness ?? null)
    setEnergy(checkin?.energy ?? null)
    setMood(checkin?.mood ?? null)
    setSorenessNote(checkin?.soreness_note ?? '')
    setEditing(!checkin)
    setDismissed(false)
  }, [date, checkin])

  if (dismissed && !checkin) return null

  const canSubmit = soreness !== null || energy !== null || mood !== null

  const handleSubmit = () => {
    submitCheckin.mutate(
      { date, checkin: { soreness, energy, mood, soreness_note: sorenessNote.trim() || null } },
      { onSuccess: () => setEditing(false) },
    )
  }

  if (!editing && checkin) {
    return (
      <div className="card daily-checkin-card">
        <div className="checkin-header">
          <h3 className="checkin-title">How you're feeling</h3>
          <button className="checkin-edit-btn" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
        <div className="checkin-summary">
          {checkin.soreness != null && <span>Soreness {checkin.soreness}/5</span>}
          {checkin.energy != null && <span>Energy {checkin.energy}/5</span>}
          {checkin.mood != null && <span>Mood {checkin.mood}/5</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="card daily-checkin-card">
      <h3 className="checkin-title">How are you feeling today?</h3>
      <TapRow label="Soreness" hint="1 = very sore, 5 = none" value={soreness} onChange={setSoreness} />
      <TapRow label="Energy" hint="1 = depleted, 5 = energized" value={energy} onChange={setEnergy} />
      <TapRow label="Mood" hint="1 = low, 5 = great" value={mood} onChange={setMood} />
      {soreness !== null && soreness <= 3 && (
        <input
          className="checkin-note-input"
          type="text"
          placeholder="Where's it sore? (optional, e.g. left knee)"
          value={sorenessNote}
          onChange={e => setSorenessNote(e.target.value)}
        />
      )}
      <div className="checkin-actions">
        <button
          className="checkin-skip"
          onClick={() => (checkin ? setEditing(false) : setDismissed(true))}
        >
          {checkin ? 'Cancel' : 'Skip'}
        </button>
        <button
          className="btn-primary checkin-submit"
          onClick={handleSubmit}
          disabled={!canSubmit || submitCheckin.isPending}
        >
          {checkin ? 'Update' : 'Log check-in'}
        </button>
      </div>
    </div>
  )
}
