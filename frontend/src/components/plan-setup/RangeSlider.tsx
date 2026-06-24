import './RangeSlider.css'

interface RangeSliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  unit?: string
}

export default function RangeSlider({ label, value, onChange, min, max, step = 1, unit = '' }: RangeSliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="rs-root">
      <div className="rs-header">
        <span className="rs-label">{label}</span>
        <span className="rs-value">{value}{unit}</span>
      </div>
      <div className="rs-track-wrap">
        <input
          type="range"
          className="rs-input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ '--rs-pct': `${pct}%` } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
