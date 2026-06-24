import { useState } from 'react'
import BottomSheet from '../BottomSheet'
import SliderPicker, { SliderOption } from '../SliderPicker'
import VolumeChart from '../VolumeChart'
import './Sheet.css'

const OPTIONS: SliderOption[] = [
  {
    value: 'gradual',
    label: 'Gradual',
    description: 'Low volume with minimal disruption to daily life, offering gentle progression to suit busy schedules.',
    bullets: ['Easy/hard run max ~12 km', 'Long run max ~32 km'],
  },
  {
    value: 'steady',
    label: 'Steady',
    description: 'Medium volume that balances steady progress with sustainable training.',
    bullets: ['Easy/hard run max ~13 km', 'Long run max ~33 km'],
  },
  {
    value: 'progressive',
    label: 'Progressive',
    description: 'High volume for those looking to push their limits and achieve peak performance.',
    bullets: ['Easy/hard run max ~15 km', 'Long run max ~34 km'],
  },
]

interface Props {
  open: boolean
  onClose: () => void
  initial: string | null
  onSave: (v: string) => void
}

export default function TrainingVolumeSheet({ open, onClose, initial, onSave }: Props) {
  const [value, setValue] = useState(initial ?? 'steady')

  function handleSave() {
    onSave(value)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Training Volume">
      <SliderPicker
        value={value}
        onChange={setValue}
        options={OPTIONS}
        chart={<VolumeChart active={value as 'gradual' | 'steady' | 'progressive'} />}
      />
      <button className="sheet-save-btn" onClick={handleSave}>Save</button>
    </BottomSheet>
  )
}
