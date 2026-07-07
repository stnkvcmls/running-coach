import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Sparkles, RefreshCw } from 'lucide-react'
import { useGenerateBriefing, useJobStatus } from '../../api/hooks'
import type { InsightResponse } from '../../api/types'
import './BriefingCard.css'

interface Props {
  dateKey: string
  planDayId: number | null
  briefing: InsightResponse | null
}

export default function BriefingCard({ dateKey, planDayId, briefing }: Props) {
  const qc = useQueryClient()
  const generateBriefing = useGenerateBriefing()
  const [jobId, setJobId] = useState<number | null>(null)
  const { data: job } = useJobStatus(jobId)

  const isGenerating =
    generateBriefing.isPending ||
    (jobId != null && job?.status !== 'done' && job?.status !== 'failed')

  useEffect(() => {
    if (job?.status === 'done' || job?.status === 'failed') {
      qc.invalidateQueries({ queryKey: ['today', dateKey] })
      setJobId(null)
    }
  }, [job?.status, dateKey, qc])

  if (planDayId == null) return null

  function handleGenerate() {
    generateBriefing.mutate(planDayId!, {
      onSuccess: (data) => { if (data?.job_id) setJobId(data.job_id) },
    })
  }

  if (!briefing) {
    return (
      <div className="card briefing-card briefing-empty">
        <div className="briefing-header">
          <Sparkles size={16} />
          <span className="briefing-title">Today's Briefing</span>
        </div>
        <p className="briefing-hint">Get a short pre-workout note tailored to today's session.</p>
        <button className="btn-primary briefing-generate" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} />}
          {isGenerating ? 'Generating…' : 'Generate briefing'}
        </button>
      </div>
    )
  }

  return (
    <div className="card briefing-card">
      <div className="briefing-header">
        <Sparkles size={16} />
        <span className="briefing-title">Today's Briefing</span>
        <button
          className="briefing-regenerate"
          onClick={handleGenerate}
          disabled={isGenerating}
          title="Regenerate briefing"
        >
          <RefreshCw size={13} className={isGenerating ? 'spin' : ''} />
        </button>
      </div>
      <div className="briefing-content">
        <ReactMarkdown>{briefing.content || briefing.summary || ''}</ReactMarkdown>
      </div>
    </div>
  )
}
