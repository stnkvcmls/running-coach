import { HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './StatHelpButton.css'

interface Props {
  topic: string
  label: string
}

/** Small question-mark icon that opens the explainer page for a stats section. */
export default function StatHelpButton({ topic, label }: Props) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className="stat-help-btn"
      aria-label={`About ${label}`}
      title={`About ${label}`}
      onClick={() => navigate(`/info/${topic}`)}
    >
      <HelpCircle size={16} />
    </button>
  )
}
