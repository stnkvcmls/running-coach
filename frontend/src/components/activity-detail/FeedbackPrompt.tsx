import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Loader } from 'lucide-react'
import { useSubmitFeedback } from '../../api/hooks'
import SetbackModal from './SetbackModal'
import './FeedbackPrompt.css'

interface Props {
  activityId: number
}

export default function FeedbackPrompt({ activityId }: Props) {
  const [showModal, setShowModal] = useState(false)
  const submitFeedback = useSubmitFeedback()

  const handleThumbsUp = () => {
    submitFeedback.mutate({ id: activityId, feedback: { rating: 'good' } })
  }

  const handleThumbsDown = () => {
    setShowModal(true)
  }

  const handleSetbackSubmit = (tags: string[], text?: string) => {
    setShowModal(false)
    submitFeedback.mutate({ id: activityId, feedback: { rating: 'bad', tags, text } })
  }

  const handleSetbackSkip = () => {
    setShowModal(false)
    submitFeedback.mutate({ id: activityId, feedback: { rating: 'bad' } })
  }

  if (submitFeedback.isPending) {
    return (
      <section className="detail-section">
        <div className="card feedback-prompt">
          <div className="feedback-prompt__loading">
            <Loader size={18} className="feedback-prompt__spinner" />
            <span>Generating insights...</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="detail-section">
        <div className="card feedback-prompt">
          <p className="feedback-prompt__question">
            How did you find this workout?
          </p>
          <p className="feedback-prompt__hint">
            Rate to unlock workout insights.
          </p>
          <div className="feedback-prompt__actions">
            <button
              className="feedback-prompt__thumb feedback-prompt__thumb--up"
              onClick={handleThumbsUp}
            >
              <ThumbsUp size={22} />
            </button>
            <button
              className="feedback-prompt__thumb feedback-prompt__thumb--down"
              onClick={handleThumbsDown}
            >
              <ThumbsDown size={22} />
            </button>
          </div>
        </div>
      </section>
      {showModal && (
        <SetbackModal onSubmit={handleSetbackSubmit} onSkip={handleSetbackSkip} />
      )}
    </>
  )
}
