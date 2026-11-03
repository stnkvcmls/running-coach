import { useRef, type KeyboardEvent } from 'react'
import { useTheme } from '../../App'
import type { ThemePreference } from '../../hooks/useThemePreference'
import './AppearanceSection.css'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const NEXT_KEYS = ['ArrowRight', 'ArrowDown']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp']

/** Settings → Appearance: System / Light / Dark, as an ARIA radio group with
 * a roving tabindex (one Tab stop; arrows move and select, as native radios do). */
export default function AppearanceSection() {
  const { preference, setPreference } = useTheme()
  const radios = useRef<(HTMLButtonElement | null)[]>([])

  const select = (index: number) => {
    setPreference(OPTIONS[index].value)
    radios.current[index]?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = OPTIONS.length - 1
    let next: number | null = null
    if (NEXT_KEYS.includes(e.key)) next = index === last ? 0 : index + 1
    else if (PREV_KEYS.includes(e.key)) next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    select(next)
  }

  return (
    <section className="settings-section">
      <h2 className="section-title" id="appearance-heading">Appearance</h2>
      <div className="card appearance-card">
        <div className="appearance-options" role="radiogroup" aria-labelledby="appearance-heading">
          {OPTIONS.map((option, i) => {
            const checked = preference === option.value
            return (
              <button
                key={option.value}
                ref={el => { radios.current[i] = el }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                className={`appearance-option ${checked ? 'active' : ''}`}
                onClick={() => select(i)}
                onKeyDown={e => handleKeyDown(e, i)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <p className="appearance-hint">System follows your device's light or dark setting.</p>
      </div>
    </section>
  )
}
