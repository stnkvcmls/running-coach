import './CardPicker.css'

export interface CardOption {
  value: string
  label: string
  description: string
  icon?: React.ReactNode
  extra?: React.ReactNode
}

interface CardPickerProps {
  value: string
  onChange: (v: string) => void
  options: CardOption[]
}

export default function CardPicker({ value, onChange, options }: CardPickerProps) {
  return (
    <div className="cp-list">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`cp-card ${opt.value === value ? 'cp-card--selected' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon && <div className="cp-icon">{opt.icon}</div>}
          <div className="cp-text">
            <span className="cp-label">{opt.label}</span>
            <span className="cp-desc">{opt.description}</span>
            {opt.extra}
          </div>
          <div className="cp-check">
            {opt.value === value && (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="9" fill="var(--accent)" />
                <path d="M5 9l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
