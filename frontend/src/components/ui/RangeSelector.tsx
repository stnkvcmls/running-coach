import './RangeSelector.css'

export interface RangeOption<T extends number = number> {
  label: string
  value: T
}

export type RangeDays = 30 | 90 | 180 | 365

/** Canonical 30/90/180/365-day option set shared by Wellness/Intensity/Aerobic. */
export const DEFAULT_RANGE_OPTIONS: RangeOption<RangeDays>[] = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '180d', value: 180 },
  { label: '365d', value: 365 },
]

interface Props<T extends number> {
  options: RangeOption<T>[]
  value: T
  onChange: (value: T) => void
}

/** Segmented day-range control (e.g. 30/90/180/365d), shared by trend views. */
export default function RangeSelector<T extends number>({ options, value, onChange }: Props<T>) {
  return (
    <div className="range-selector">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`range-selector-btn ${value === opt.value ? 'active' : ''}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
