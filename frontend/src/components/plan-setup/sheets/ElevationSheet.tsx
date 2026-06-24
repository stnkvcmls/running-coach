import { useState } from 'react'
import BottomSheet from '../BottomSheet'
import CardPicker, { CardOption } from '../CardPicker'
import './Sheet.css'

const OPTIONS: CardOption[] = [
  {
    value: 'flat',
    label: 'Flat',
    description: 'No hill workouts. Recommended if there is less than 5 m/km of elevation gain for your race.',
    icon: '⟶',
  },
  {
    value: 'rolling',
    label: 'Rolling',
    description: 'Some hill workouts. Recommended if elevation gain is between 5 m/km and 10 m/km.',
    icon: '〜',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'More hill workouts. Recommended if elevation gain is between 10 m/km and 20 m/km.',
    icon: '⛰',
  },
  {
    value: 'hilly',
    label: 'Hilly',
    description: 'Lots of hill workouts. Recommended if elevation gain is more than 20 m/km.',
    icon: '🏔',
  },
]

interface Props {
  open: boolean
  onClose: () => void
  initial: string | null
  onSave: (v: string) => void
}

export default function ElevationSheet({ open, onClose, initial, onSave }: Props) {
  const [value, setValue] = useState(initial ?? 'flat')

  function handleSave() {
    onSave(value)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Elevation Profile">
      <CardPicker value={value} onChange={setValue} options={OPTIONS} />
      <button className="sheet-save-btn" onClick={handleSave}>Save</button>
    </BottomSheet>
  )
}
