import './SliderPicker.css'

export interface SliderOption {
  value: string
  label: string
  description: string
  bullets?: string[]
}

interface SliderPickerProps {
  value: string
  onChange: (v: string) => void
  options: SliderOption[]
  chart?: React.ReactNode
}

export default function SliderPicker({ value, onChange, options, chart }: SliderPickerProps) {
  const idx = options.findIndex(o => o.value === value)
  const active = idx >= 0 ? idx : 0
  const option = options[active]

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const i = Math.min(options.length - 1, Math.max(0, Math.round(pct * (options.length - 1))))
    onChange(options[i].value)
  }

  const thumbPct = options.length > 1 ? (active / (options.length - 1)) * 100 : 50

  return (
    <div className="sp-root">
      {chart && <div className="sp-chart">{chart}</div>}

      <div className="sp-labels">
        {options.map((o, i) => (
          <button
            key={o.value}
            className={`sp-label ${i === active ? 'sp-label--active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="sp-track" onClick={handleTrackClick}>
        <div className="sp-fill" style={{ width: `${thumbPct}%` }} />
        <div className="sp-thumb" style={{ left: `${thumbPct}%` }} />
      </div>

      <div className="sp-info">
        <p className="sp-description">{option.description}</p>
        {option.bullets && option.bullets.length > 0 && (
          <ul className="sp-bullets">
            {option.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
