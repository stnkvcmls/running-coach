import { useState } from 'react'
import BottomSheet from '../BottomSheet'
import RangeSlider from '../RangeSlider'
import './Sheet.css'

interface Props {
  open: boolean
  onClose: () => void
  initialWeekly: number | null
  initialLongest: number | null
  initialTarget: number | null
  onSave: (weekly: number, longest: number, target: number) => void
}

export default function MileageSheet({ open, onClose, initialWeekly, initialLongest, initialTarget, onSave }: Props) {
  const [weekly, setWeekly] = useState(initialWeekly ?? 30)
  const [longest, setLongest] = useState(initialLongest ?? 12)
  const [target, setTarget] = useState(initialTarget ?? 40)

  function handleSave() {
    onSave(weekly, longest, target)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Current Fitness">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.4 }}>
            Select your average weekly mileage from the past 4 weeks.
          </p>
          <RangeSlider
            label="Current Weekly Mileage"
            value={weekly}
            onChange={setWeekly}
            min={0}
            max={200}
            step={1}
            unit="km"
          />
        </div>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.4 }}>
            Select the longest run you've completed in the past 4 weeks.
          </p>
          <RangeSlider
            label="Current Longest Run"
            value={longest}
            onChange={setLongest}
            min={0}
            max={50}
            step={0.5}
            unit="km"
          />
        </div>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.4 }}>
            How many kilometres per week do you want your plan to target?
          </p>
          <RangeSlider
            label="Total Weekly Mileage"
            value={target}
            onChange={setTarget}
            min={0}
            max={200}
            step={1}
            unit="km"
          />
        </div>
      </div>
      <button className="sheet-save-btn" onClick={handleSave}>Save</button>
    </BottomSheet>
  )
}
