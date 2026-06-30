import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, BrainCircuit, Trash2, Zap } from 'lucide-react'
import type { ChatAction, ChatMessage } from '../../api/types'
import './ChatView.css'

const BASE = '/api/v1'

const HINT_PROMPTS = [
  'How was my training this week?',
  'Am I ready for my next race?',
  'Why is my easy pace slower lately?',
  'What should I focus on tomorrow?',
]

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function ActionChips({ actions }: { actions: ChatAction[] | null | undefined }) {
  if (!actions || actions.length === 0) return null
  return (
    <div className="chat-action-chips">
      {actions.map((action, i) => (
        <div key={`${action.type}-${i}`} className="chat-action-chip">
          <Zap size={12} />
          {action.summary}
        </div>
      ))}
    </div>
  )
}

export default function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingActions, setStreamingActions] = useState<ChatAction[]>([])
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load history on mount
  useEffect(() => {
    fetch(`${BASE}/chat`)
      .then(r => r.json())
      .then(data => setMessages(data.messages ?? []))
      .catch(() => {})
  }, [])

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const resizeTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`
  }

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    setError(null)
    const tempId = Date.now()
    const userMsg: ChatMessage = {
      id: tempId,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
      activity_id: null,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setStreaming(true)
    setStreamingContent('')
    setStreamingActions([])

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        signal: ctrl.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      const fullActions: ChatAction[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) {
              setError(parsed.error)
            } else if (parsed.token) {
              fullContent += parsed.token
              setStreamingContent(fullContent)
            } else if (parsed.action) {
              fullActions.push(parsed.action)
              setStreamingActions([...fullActions])
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }

      // Commit completed AI response into the message list
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
        activity_id: null,
        actions: fullActions.length > 0 ? fullActions : null,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Something went wrong')
      }
    } finally {
      setStreaming(false)
      setStreamingContent('')
      setStreamingActions([])
      abortRef.current = null
    }
  }, [streaming])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = async () => {
    if (!confirm('Clear all chat messages?')) return
    await fetch(`${BASE}/chat`, { method: 'DELETE' })
    setMessages([])
  }

  const isEmpty = messages.length === 0 && !streaming

  return (
    <div className="chat-view">
      <div className="chat-messages">
        {isEmpty ? (
          <div className="chat-empty">
            <BrainCircuit size={40} className="chat-empty-icon" />
            <span className="chat-empty-title">Ask your AI coach anything</span>
            <div className="chat-empty-hints">
              {HINT_PROMPTS.map(hint => (
                <button
                  key={hint}
                  className="chat-hint-chip"
                  onClick={() => sendMessage(hint)}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`chat-bubble-row ${msg.role}`}>
                <div className={`chat-avatar ${msg.role}`}>
                  {msg.role === 'assistant' ? 'AI' : 'Me'}
                </div>
                <div>
                  {msg.role === 'assistant' && <ActionChips actions={msg.actions} />}
                  <div className={`chat-bubble ${msg.role}`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <div
                    className="chat-time"
                    style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}
                  >
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            ))}

            {streaming && (
              <div className="chat-bubble-row assistant">
                <div className="chat-avatar assistant">AI</div>
                <div>
                  <ActionChips actions={streamingActions} />
                  <div className={`chat-bubble assistant${streamingContent ? ' streaming' : ''}`}>
                    {streamingContent ? (
                      <ReactMarkdown>{streamingContent}</ReactMarkdown>
                    ) : (
                      <span className="chat-thinking">Thinking…</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="chat-error">{error}</div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        {messages.length > 0 && (
          <button
            className="chat-clear-btn"
            onClick={clearChat}
            title="Clear conversation"
            disabled={streaming}
          >
            <Trash2 size={16} />
          </button>
        )}
        <div className="chat-input-wrap">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={1}
            placeholder="Ask your coach…"
            value={input}
            onChange={e => { setInput(e.target.value); resizeTextarea() }}
            onKeyDown={handleKeyDown}
            disabled={streaming}
          />
        </div>
        <button
          className="chat-send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
