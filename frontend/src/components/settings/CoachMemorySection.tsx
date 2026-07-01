import { useState } from 'react'
import { X } from 'lucide-react'
import {
  useCoachMemories,
  useCreateCoachMemory,
  useUpdateCoachMemory,
  useDeleteCoachMemory,
} from '../../api/hooks'
import type { CoachMemoryCategory } from '../../api/types'
import './CoachMemorySection.css'

const CATEGORIES: CoachMemoryCategory[] = ['niggle', 'constraint', 'preference', 'note']

export default function CoachMemorySection() {
  const { data: memories, isLoading } = useCoachMemories()
  const create = useCreateCoachMemory()
  const update = useUpdateCoachMemory()
  const remove = useDeleteCoachMemory()

  const [category, setCategory] = useState<CoachMemoryCategory>('note')
  const [tag, setTag] = useState('')
  const [note, setNote] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tag.trim() || !note.trim()) return
    create.mutate(
      { category, tag: tag.trim(), note: note.trim() },
      { onSuccess: () => { setTag(''); setNote('') } },
    )
  }

  if (isLoading) return null

  return (
    <section className="settings-section">
      <h2 className="section-title">Coach Memory</h2>
      <p className="cm-desc">
        Durable facts the coach remembers on every chat and analysis — niggles,
        life constraints, preferences. The coach also records these itself when
        you mention a setback in chat.
      </p>
      <div className="card cm-card">
        <form className="cm-form" onSubmit={handleAdd}>
          <select
            className="cm-category-select"
            value={category}
            onChange={e => setCategory(e.target.value as CoachMemoryCategory)}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Short label, e.g. 'knee pain'"
            value={tag}
            onChange={e => setTag(e.target.value)}
          />
          <input
            type="text"
            placeholder="Note"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <button className="sync-btn" type="submit" disabled={create.isPending || !tag.trim() || !note.trim()}>
            {create.isPending ? 'Adding…' : 'Add'}
          </button>
        </form>

        {!memories || memories.length === 0 ? (
          <p className="cm-empty">Nothing remembered yet.</p>
        ) : (
          <ul className="cm-list">
            {memories.map(m => (
              <li key={m.id} className={`cm-item${m.active ? '' : ' cm-item--inactive'}`}>
                <span className="cm-category-badge">{m.category}</span>
                <span className="cm-item-body">
                  <strong>{m.tag}</strong>
                  <span className="cm-item-note">{m.note}</span>
                </span>
                <label className="cm-resolve">
                  <input
                    type="checkbox"
                    checked={!m.active}
                    onChange={e => update.mutate({ id: m.id, memory: { active: !e.target.checked } })}
                  />
                  Resolved
                </label>
                <button
                  className="cm-delete-btn"
                  onClick={() => remove.mutate(m.id)}
                  aria-label={`Delete ${m.tag}`}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {create.isError && <span className="cm-error">Failed to add memory</span>}
      </div>
    </section>
  )
}
