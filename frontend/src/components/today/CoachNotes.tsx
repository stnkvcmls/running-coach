import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import type { InsightResponse } from '../../api/types'
import { format, parseISO } from '../../utils/date'
import { firstSentence } from '../../utils/text'
import './CoachNotes.css'

const SHOWN = 2

function NoteRow({ insight }: { insight: InsightResponse }) {
  const [open, setOpen] = useState(false)
  const title = insight.summary || 'Note from your coach'
  const line = insight.content ? firstSentence(insight.content) : null
  const date = insight.created_at ? format(parseISO(insight.created_at), 'EEE d') : null
  const activityId = insight.trigger_type === 'activity' && insight.trigger_id ? insight.trigger_id : null

  return (
    <li className="note-row">
      <button type="button" className="note-head" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <span className="note-title">{title}</span>
        {date && <span className="note-date">{date}</span>}
      </button>
      {open && insight.content ? (
        <div className="note-full">
          <ReactMarkdown>{insight.content}</ReactMarkdown>
        </div>
      ) : (
        line && line !== title && <p className="note-line">{line}</p>
      )}
      {activityId && (
        <Link to={`/activities/${activityId}`} className="text-link note-link">Open the run</Link>
      )}
    </li>
  )
}

interface Props {
  insights: InsightResponse[]
}

/** The latest two coach notes with title, date and one line; "All notes"
 * expands the rest in place (there's no separate notes screen yet). */
export default function CoachNotes({ insights }: Props) {
  const [all, setAll] = useState(false)
  const sorted = [...insights].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  const shown = all ? sorted : sorted.slice(0, SHOWN)

  return (
    <section className="card today-panel coach-notes" aria-labelledby="coach-notes-title">
      <div className="panel-head">
        <h2 id="coach-notes-title" className="section-title">From your coach</h2>
        {sorted.length > SHOWN && (
          <button type="button" className="text-link panel-head-link" onClick={() => setAll(v => !v)} aria-expanded={all}>
            {all ? 'Fewer notes' : 'All notes'}
          </button>
        )}
      </div>
      <ul className="panel-rows">
        {shown.map(i => <NoteRow key={i.id} insight={i} />)}
      </ul>
    </section>
  )
}
