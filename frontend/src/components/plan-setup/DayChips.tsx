import './DayChips.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayChipsProps {
  value: string[]
  onChange: (v: string[]) => void
  single?: boolean
}

export default function DayChips({ value, onChange, single = false }: DayChipsProps) {
  function toggle(day: string) {
    if (single) {
      onChange([day])
      return
    }
    if (value.includes(day)) {
      onChange(value.filter(d => d !== day))
    } else {
      onChange([...value, day])
    }
  }

  return (
    <div className="dc-chips">
      {DAYS.map(day => (
        <button
          key={day}
          className={`dc-chip ${value.includes(day) ? 'dc-chip--on' : ''}`}
          onClick={() => toggle(day)}
        >
          {day}
        </button>
      ))}
    </div>
  )
}
