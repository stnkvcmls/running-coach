import { Lightbulb, RotateCcw } from 'lucide-react'
import type { InsightResponse } from '../../api/types'
import './AiInsightCard.css'

interface Props {
  insight: InsightResponse
  onReanalyze: () => void
  isAnalyzing: boolean
}

export default function AiInsightCard({ insight, onReanalyze, isAnalyzing }: Props) {
  return (
    <section className="detail-section">
      <div className="ai-insight-card card">
        <div className="ai-header">
          <div className="ai-title-row">
            <Lightbulb size={18} className="ai-icon" />
            <h3 className="section-title" style={{ margin: 0 }}>Workout Insights</h3>
          </div>
          <button
            className="analyze-btn"
            onClick={onReanalyze}
            disabled={isAnalyzing}
          >
            <RotateCcw size={14} />
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
          </button>
        </div>
        {insight.summary && (
          <div className="ai-summary">{insight.summary}</div>
        )}
        {insight.content && (
          <div className="ai-content">{insight.content}</div>
        )}
      </div>
    </section>
  )
}
