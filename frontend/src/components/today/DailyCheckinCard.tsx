import { useEffect, useState } from 'react'
import { useSubmitDailyCheckin } from '../../api/hooks'
import type { DailyCheckin } from '../../api/types'
import './DailyCheckinCard.css'

interface Props {
  date: string
  checkin: DailyCheckin | null
}

const SCALE = [1, 2, 3, 4, 5]

function tone(value: number): 'good' | 'okay' | 'low' {
  if (value >= 4) return 'good'
  if (value === 3) return 'okay'
  return 'low'
}

function moodWord(mood: number | null): string | null {
  if (mood == null) return null
  if (mood >= 5) return 'Feeling great'
  if (mood === 4) return 'Feeling good'
  if (mood === 3) return 'Feeling okay'
  if (mood === 2) return 'Feeling low'
  return 'Feeling rough'
}

function sorenessWord(soreness: number | null): string | null {
  if (soreness == null) return null
  if (soreness === 5) return 'no soreness'
  if (soreness === 4) return 'low soreness'
  if (soreness === 3) return 'some soreness'
  return 'sore'
}

function energyWord(energy: number | null): string | null {
  if (energy == null) return null
  if (energy >= 4) return 'energized'
  if (energy === 3) return 'steady energy'
  return 'low energy'
}

function checkinSummary(checkin: DailyCheckin): string {
  const parts = [moodWord(checkin.mood), sorenessWord(checkin.soreness)].filter((p): p is string => p != null)
  if (parts.length === 0) {
    const energy = energyWord(checkin.energy)
    if (energy) parts.push(energy)
  }
  return parts.length > 0 ? parts.join(' · ') : 'Logged'
}

function ScaleRow({
  label,
  low,
  high,
  value,
  onChange,
  disabled,
}: {
  label: string
  low: string
  high: string
  value: number | null
  onChange: (v: number) => void
  disabled: boolean
}) {
  return (
    <div className="checkin-row">
      <span className="checkin-row-name">{label}</span>
      <div className="seg-control" role="group" aria-label={`${label}, 1 ${low.toLowerCase()} to 5 ${high.toLowerCase()}`}>
        {SCALE.map(v => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            disabled={disabled}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <span className="seg-control-ends checkin-row-ends"><span>{low}</span><span>{high}</span></span>
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
  // Saved with soreness ≤ 3: stay open so the optional "where" note can be added.
  const [notePending, setNotePending] = useState(false)
  const submitCheckin = useSubmitDailyCheckin()

  // Reset local state when the viewed date (or its check-in) changes — but
  // not while the just-saved card is waiting on the optional soreness note.
  useEffect(() => {
    if (notePending) return
    setSoreness(checkin?.soreness ?? null)
    setEnergy(checkin?.energy ?? null)
    setMood(checkin?.mood ?? null)
    setSorenessNote(checkin?.soreness_note ?? '')
    setEditing(!checkin)
    setDismissed(false)
  }, [date, checkin]) // notePending deliberately omitted: clearing it must not reset the form

  if (dismissed && !checkin) return null

  const save = (values: { soreness: number | null; energy: number | null; mood: number | null }, note = sorenessNote) => {
    const keepOpen = values.soreness != null && values.soreness <= 3
    submitCheckin.mutate(
      { date, checkin: { ...values, soreness_note: note.trim() || null } },
      {
        onSuccess: () => {
          setNotePending(keepOpen)
          if (!keepOpen) setEditing(false)
        },
      },
    )
  }

  // Auto-save as soon as all three are answered; no separate "Log" step.
  const pick = (field: 'soreness' | 'energy' | 'mood', v: number) => {
    const next = { soreness, energy, mood, [field]: v }
    if (field === 'soreness') setSoreness(v)
    if (field === 'energy') setEnergy(v)
    if (field === 'mood') setMood(v)
    if (next.soreness != null && next.energy != null && next.mood != null) save(next)
  }

  const finishNote = () => {
    if (sorenessNote.trim() !== (checkin?.soreness_note ?? '')) save({ soreness, energy, mood })
    setNotePending(false)
    setEditing(false)
  }

  if (!editing && checkin) {
    const primary = checkin.mood ?? checkin.energy ?? checkin.soreness ?? 4
    return (
      <button className="checkin-chip" onClick={() => setEditing(true)}>
        <span className={`checkin-chip-dot checkin-chip-dot--${tone(primary)}`} />
        <span className="checkin-chip-summary">{checkinSummary(checkin)}</span>
        <span className="checkin-chip-edit">Edit</span>
      </button>
    )
  }

  const answered = [soreness, energy, mood].filter(v => v != null).length

  return (
    <div className="card daily-checkin-card">
      <h3 className="checkin-title">How do you feel this morning?</h3>
      <ScaleRow label="Soreness" low="Very sore" high="None" value={soreness} onChange={v => pick('soreness', v)} disabled={submitCheckin.isPending} />
      <ScaleRow label="Energy" low="Drained" high="Full" value={energy} onChange={v => pick('energy', v)} disabled={submitCheckin.isPending} />
      <ScaleRow label="Mood" low="Low" high="Great" value={mood} onChange={v => pick('mood', v)} disabled={submitCheckin.isPending} />
      {soreness !== null && soreness <= 3 && (
        <input
          className="checkin-note-input"
          type="text"
          placeholder="Where's it sore? (optional, e.g. left knee)"
          aria-label="Where's it sore?"
          value={sorenessNote}
          onChange={e => setSorenessNote(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && notePending) finishNote() }}
        />
      )}
      <div className="checkin-foot">
        <p className="checkin-foot-text" aria-live="polite">
          {submitCheckin.isPending
            ? 'Saving…'
            : notePending
              ? 'Saved. Add where it’s sore, or leave it blank.'
              : answered < 3
                ? 'Saves when all three are set. Your coach folds it into readiness.'
                : ''}
        </p>
        {notePending ? (
          <button type="button" className="checkin-skip" onClick={finishNote}>Done</button>
        ) : (
          <button
            type="button"
            className="checkin-skip"
            onClick={() => (checkin ? setEditing(false) : setDismissed(true))}
          >
            {checkin ? 'Cancel' : 'Skip'}
          </button>
        )}
      </div>
    </div>
  )
}
