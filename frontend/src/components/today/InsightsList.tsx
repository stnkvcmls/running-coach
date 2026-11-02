import { useState } from 'react'
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { InsightResponse } from '../../api/types'
import './InsightsList.css'

interface Props {
  insights: InsightResponse[]
}

export default function InsightsList({ insights }: Props) {
  return (
    <div className="insights-list">
      {insights.map(insight => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  )
}

function InsightCard({ insight }: { insight: InsightResponse }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="insight-card card">
      <button
        type="button"
        className="insight-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <Lightbulb size={16} style={{ color: 'var(--text)', flexShrink: 0 }} />
        <span className="insight-summary">{insight.summary || 'AI Insight'}</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && insight.content && (
        <div className="insight-content">
          <ReactMarkdown>{insight.content}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
