import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import './SetbackModal.css'

const SETBACK_OPTIONS = [
  'Paces too tough',
  'Workout felt too long',
  'Not ideal conditions',
  'Technical issues',
  'Not feeling 100%',
  "My mind wasn't in it",
  "Didn't like this workout",
]

interface Props {
  onSubmit: (tags: string[], text?: string) => void
  onSkip: () => void
}

export default function SetbackModal({ onSubmit, onSkip }: Props) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showOther, setShowOther] = useState(false)
  const [otherText, setOtherText] = useState('')

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onSkip])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    onSubmit(selectedTags, otherText.trim() || undefined)
  }

  const canSubmit = selectedTags.length > 0 || otherText.trim().length > 0

  return (
    <div className="setback-modal__overlay" onClick={onSkip}>
      <div className="setback-modal__content" onClick={e => e.stopPropagation()}>
        <button className="setback-modal__close" onClick={onSkip}>
          <X size={20} />
        </button>
        <h2 className="setback-modal__title">What went wrong?</h2>
        <p className="setback-modal__subtitle">
          Tell us more to help us improve. Select all that apply.
        </p>

        <div className="setback-modal__chips">
          {SETBACK_OPTIONS.map(tag => (
            <button
              key={tag}
              className={`setback-modal__chip ${selectedTags.includes(tag) ? 'setback-modal__chip--selected' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
          <button
            className={`setback-modal__chip ${showOther ? 'setback-modal__chip--selected' : ''}`}
            onClick={() => setShowOther(!showOther)}
          >
            Other
          </button>
        </div>

        {showOther && (
          <textarea
            className="setback-modal__other-input"
            placeholder="Tell us more..."
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            rows={3}
            autoFocus
          />
        )}

        <div className="setback-modal__actions">
          <button className="setback-modal__skip" onClick={onSkip}>
            Skip
          </button>
          <button
            className="setback-modal__submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
