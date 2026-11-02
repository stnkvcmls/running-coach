import { useState } from 'react'
import BottomSheet from '../BottomSheet'
import DayChips from '../DayChips'
import './Sheet.css'

interface Props {
  open: boolean
  onClose: () => void
  initialRunsPerWeek: number | null
  initialAvailableDays: string[]
  initialLongRunDay: string | null
  onSave: (runsPerWeek: number, availableDays: string[], longRunDay: string) => void
}

export default function ScheduleSheet({
  open, onClose,
  initialRunsPerWeek, initialAvailableDays, initialLongRunDay,
  onSave,
}: Props) {
  const [runsPerWeek, setRunsPerWeek] = useState(initialRunsPerWeek ?? 4)
  const [availableDays, setAvailableDays] = useState<string[]>(
    initialAvailableDays.length > 0 ? initialAvailableDays : ['Mon', 'Wed', 'Sat', 'Sun']
  )
  const [longRunDay, setLongRunDay] = useState<string[]>(
    initialLongRunDay ? [initialLongRunDay] : ['Sun']
  )

  function handleSave() {
    onSave(runsPerWeek, availableDays, longRunDay[0] ?? 'Sun')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Running schedule">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="sheet-section">
          <div className="sheet-section-title">Runs per week</div>
          <div className="sheet-stepper">
            <button
              className="sheet-stepper-btn"
              onClick={() => setRunsPerWeek(v => Math.max(1, v - 1))}
              disabled={runsPerWeek <= 1}
            >−</button>
            <span className="sheet-stepper-val num">{runsPerWeek}</span>
            <button
              className="sheet-stepper-btn"
              onClick={() => setRunsPerWeek(v => Math.min(7, v + 1))}
              disabled={runsPerWeek >= 7}
            >+</button>
          </div>
        </div>

        <div className="sheet-section">
          <div className="sheet-section-title">Available days</div>
          <DayChips value={availableDays} onChange={setAvailableDays} />
        </div>

        <div className="sheet-section">
          <div className="sheet-section-title">Long run day</div>
          <DayChips value={longRunDay} onChange={setLongRunDay} single />
        </div>
      </div>
      <button className="sheet-save-btn" onClick={handleSave}>Save</button>
    </BottomSheet>
  )
}
