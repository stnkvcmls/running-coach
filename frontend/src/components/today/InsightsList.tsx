import { useState } from 'react'
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
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

  const categoryColors: Record<string, string> = {
    workout_analysis: '#6c5ce7',
    recovery: '#2ecc71',
    training_plan: '#0984e3',
    trend: '#f39c12',
    recommendation: '#e84393',
  }
  const color = categoryColors[insight.category || ''] || '#6c5ce7'

  return (
    <div className="insight-card card" onClick={() => setExpanded(!expanded)}>
      <div className="insight-header">
        <Lightbulb size={16} style={{ color, flexShrink: 0 }} />
        <span className="insight-summary">{insight.summary || 'AI Insight'}</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {expanded && insight.content && (
        <div className="insight-content">{insight.content}</div>
      )}
    </div>
  )
}
