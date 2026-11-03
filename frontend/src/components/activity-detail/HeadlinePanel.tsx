import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Loader, RotateCcw } from 'lucide-react'
import type { ActivityDetail } from '../../api/types'
import { formatDistance, formatDuration, formatPace } from '../../utils/formatting'
import './AiInsightCard.css'

/** First sentence of a markdown text, with the inline markup stripped. */
export function firstSentence(markdown: string): string {
  const stripped = markdown
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .trim()
  return stripped.split(/(?<=[.!?])\s/)[0] || stripped
}

interface Props {
  activity: ActivityDetail
  onReanalyze: () => void
  isAnalyzing: boolean
}

/** The top of the run analysis (D2): the three headline figures, then one
 * coach verdict. "Full analysis" opens the whole AI insight in place, so the
 * coach is never repeated in a second card further down. */
export default function HeadlinePanel({ activity, onReanalyze, isAnalyzing }: Props) {
  const [expanded, setExpanded] = useState(false)
  const insight = activity.insight
  const verdictSource = insight?.summary || insight?.content || null

  return (
    <section className="detail-panel headline-panel">
      <dl className="headline-figs">
        <div>
          <dt>Distance</dt>
          <dd className="num">{formatDistance(activity.distance_m)}<small>km</small></dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd className="num">{formatDuration(activity.duration_sec)}</dd>
        </div>
        <div>
          <dt>Avg pace</dt>
          <dd className="num">{formatPace(activity.avg_pace_min_km)}<small>/km</small></dd>
        </div>
      </dl>

      {insight && verdictSource ? (
        <div className="headline-verdict">
          <p className="verdict">
            <b>Coach:</b> {firstSentence(verdictSource)}{' '}
            <button
              type="button"
              className="detail-panel-link"
              aria-expanded={expanded}
              aria-controls="ai-insight"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? 'Hide analysis' : 'Full analysis'}
            </button>
          </p>
          {expanded && (
            <div className="ai-analysis" id="ai-insight">
              {insight.summary && (
                <div className="ai-summary">
                  <ReactMarkdown>{insight.summary}</ReactMarkdown>
                </div>
              )}
              {insight.content && (
                <div className="ai-content">
                  <ReactMarkdown>{insight.content}</ReactMarkdown>
                </div>
              )}
              <button type="button" className="analyze-btn" onClick={onReanalyze} disabled={isAnalyzing}>
                <RotateCcw size={14} aria-hidden="true" />
                {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
              </button>
            </div>
          )}
        </div>
      ) : !insight && (activity.feedback_rating || isAnalyzing) ? (
        <p className="headline-verdict verdict verdict-pending">
          <Loader size={16} className="spin" aria-hidden="true" />
          Generating insights...
        </p>
      ) : null}
    </section>
  )
}
