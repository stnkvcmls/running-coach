import { useTheme, useSkin, SKIN_LABELS, type Skin } from '../../App'
import './AppearanceSection.css'

const SKINS: Skin[] = ['default', 'nothing-signal', 'nothing-app']

const SKIN_DESCRIPTIONS: Record<Skin, string> = {
  'default': 'The current look.',
  'nothing-signal': 'Monochrome, dot-matrix. One red accent.',
  'nothing-app': 'Monochrome layout, keeps the current workout colours.',
}

export default function AppearanceSection() {
  const { theme, toggleTheme } = useTheme()
  const { skin, setSkin } = useSkin()

  return (
    <section className="settings-section">
      <h2 className="section-title">Appearance</h2>
      <div className="card appearance-card">
        <div>
          <span className="appearance-group-label">Mode</span>
          <div className="appearance-segmented" role="radiogroup" aria-label="Mode">
            <button
              type="button"
              role="radio"
              className={`appearance-segment ${theme === 'dark' ? 'active' : ''}`}
              aria-checked={theme === 'dark'}
              onClick={() => theme !== 'dark' && toggleTheme()}
            >
              Dark
            </button>
            <button
              type="button"
              role="radio"
              className={`appearance-segment ${theme === 'light' ? 'active' : ''}`}
              aria-checked={theme === 'light'}
              onClick={() => theme !== 'light' && toggleTheme()}
            >
              Light
            </button>
          </div>
        </div>

        <fieldset className="appearance-style">
          <legend className="appearance-group-label">Style</legend>
          {SKINS.map(s => (
            <label key={s} className="appearance-skin-row">
              <input
                type="radio"
                name="skin"
                value={s}
                checked={skin === s}
                onChange={() => setSkin(s)}
              />
              <span className="appearance-skin-swatch" data-skin-preview={s} aria-hidden="true">
                <i className="swatch-dot swatch-surface" />
                <i className="swatch-dot swatch-ink" />
                <i className="swatch-dot swatch-accent" />
              </span>
              <span className="appearance-skin-text">
                <span className="appearance-skin-name">{SKIN_LABELS[s]}</span>
                <span className="appearance-skin-desc">{SKIN_DESCRIPTIONS[s]}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </section>
  )
}
