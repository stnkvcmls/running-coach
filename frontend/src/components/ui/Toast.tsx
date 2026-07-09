import { useEffect, useState } from 'react'
import './Toast.css'

export type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

const MAX_TOASTS = 2
const DISMISS_MS = 4000

let nextId = 1
let toasts: ToastItem[] = []
const listeners = new Set<(items: ToastItem[]) => void>()

function emit() {
  listeners.forEach(listener => listener(toasts))
}

function dismiss(id: number) {
  toasts = toasts.filter(t => t.id !== id)
  emit()
}

/** Queue a toast from anywhere — no provider/hook required. */
export function toast(message: string, opts: { kind?: ToastKind } = {}): void {
  const item: ToastItem = { id: nextId++, message, kind: opts.kind ?? 'info' }
  toasts = [...toasts, item].slice(-MAX_TOASTS)
  emit()
  setTimeout(() => dismiss(item.id), DISMISS_MS)
}

/** Mount once (in App.tsx) to render whatever toast() queues up. */
export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>(toasts)

  useEffect(() => {
    listeners.add(setItems)
    return () => { listeners.delete(setItems) }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {items.map(t => (
        <button
          key={t.id}
          type="button"
          className={`toast toast-${t.kind}`}
          onClick={() => dismiss(t.id)}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
