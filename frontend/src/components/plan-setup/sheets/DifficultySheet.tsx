import { useState } from 'react'
import BottomSheet from '../BottomSheet'
import SliderPicker, { SliderOption } from '../SliderPicker'
import './Sheet.css'

const OPTIONS: SliderOption[] = [
  {
    value: 'comfortable',
    label: 'Comfortable',
    description: 'A gentler approach, offering runs that prioritize consistency over challenge.',
    bullets: ['1 hard run every week', 'Minimal difficulty hard runs', 'Rarely long runs will have pace targets'],
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'A well-rounded option for those who want more demanding runs while keeping balance with recovery.',
    bullets: ['1–2 hard runs per week', 'Reduced difficulty hard runs', 'Fewer long runs will have pace targets'],
  },
  {
    value: 'challenging',
    label: 'Challenging',
    description: 'Runs designed to keep you working hard, with a strong focus on improving speed and endurance.',
    bullets: ['2 hard runs per week', 'Regular difficulty hard runs', 'Often long runs will have pace targets'],
  },
]

interface Props {
  open: boolean
  onClose: () => void
  initial: string | null
  onSave: (v: string) => void
}

export default function DifficultySheet({ open, onClose, initial, onSave }: Props) {
  const [value, setValue] = useState(initial ?? 'balanced')

  function handleSave() {
    onSave(value)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Difficulty">
      <SliderPicker value={value} onChange={setValue} options={OPTIONS} />
      <button className="sheet-save-btn" onClick={handleSave}>Save</button>
    </BottomSheet>
  )
}
