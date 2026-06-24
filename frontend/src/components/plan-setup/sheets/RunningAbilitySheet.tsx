import { useState } from 'react'
import BottomSheet from '../BottomSheet'
import CardPicker, { CardOption } from '../CardPicker'
import './Sheet.css'

const OPTIONS: CardOption[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'You can complete a 5 km run without stopping, in under 60 minutes',
    icon: '🚶',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'You regularly run at least 5 km but don\'t structure your training',
    icon: '🏃',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'You regularly run at least 10 km and do some structured training e.g. intervals',
    icon: '🏃',
  },
  {
    value: 'elite',
    label: 'Elite',
    description: 'You regularly run half-marathons or further and are experienced with structured training',
    icon: '⚡',
  },
]

interface Props {
  open: boolean
  onClose: () => void
  initial: string | null
  onSave: (v: string) => void
}

export default function RunningAbilitySheet({ open, onClose, initial, onSave }: Props) {
  const [value, setValue] = useState(initial ?? 'intermediate')

  function handleSave() {
    onSave(value)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Running Ability">
      <CardPicker value={value} onChange={setValue} options={OPTIONS} />
      <button className="sheet-save-btn" onClick={handleSave}>Save</button>
    </BottomSheet>
  )
}
