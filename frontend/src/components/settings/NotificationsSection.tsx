import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import {
  useVapidPublicKey,
  useCreatePushSubscription,
  useDeletePushSubscription,
  useNotificationPreferences,
  useSetNotificationPreferences,
} from '../../api/hooks'
import './NotificationsSection.css'

function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function NotificationsSection() {
  const { data: vapid } = useVapidPublicKey()
  const { data: prefs } = useNotificationPreferences()
  const subscribe = useCreatePushSubscription()
  const unsubscribe = useDeletePushSubscription()
  const setPrefs = useSetNotificationPreferences()

  const pushSupported = isPushSupported()
  const [subscribed, setSubscribed] = useState(false)
  const [swReady, setSwReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pushSupported) {
      setChecking(false)
      return
    }
    let cancelled = false
    navigator.serviceWorker
      .getRegistration()
      .then(reg => {
        if (cancelled) return
        if (!reg) {
          setSwReady(false)
          return
        }
        setSwReady(true)
        return reg.pushManager.getSubscription().then(sub => {
          if (!cancelled) setSubscribed(!!sub)
        })
      })
      .catch(() => {
        if (!cancelled) setSwReady(false)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [pushSupported])

  if (!pushSupported) {
    return (
      <section className="settings-section">
        <h2 className="section-title">Notifications</h2>
        <div className="card notif-card">
          <p className="notif-unsupported">Push notifications aren't supported in this browser.</p>
        </div>
      </section>
    )
  }

  const handleEnable = async () => {
    setError(null)
    if (!vapid?.configured || !vapid.public_key) {
      setError('Push notifications are not configured on the server.')
      return
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        setSwReady(false)
        setError('Notifications need the installed app (service worker not active).')
        return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Notification permission was denied.')
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.public_key),
      })
      const json = sub.toJSON()
      await subscribe.mutateAsync({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
        user_agent: navigator.userAgent,
      })
      setSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications')
    }
  }

  const handleDisable = async () => {
    setError(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await unsubscribe.mutateAsync(sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable notifications')
    }
  }

  return (
    <section className="settings-section">
      <h2 className="section-title">Notifications</h2>
      <div className="card notif-card">
        {checking ? null : !swReady ? (
          <p className="notif-unsupported">
            Notifications need the installed app (service worker not active).
          </p>
        ) : subscribed ? (
          <div className="notif-status">
            <span className="notif-status-line">
              <Bell size={16} /> Push notifications enabled on this device
            </span>
            <button className="sync-btn notif-disable" onClick={handleDisable} disabled={unsubscribe.isPending}>
              <BellOff size={16} />
              {unsubscribe.isPending ? 'Disabling…' : 'Disable'}
            </button>
          </div>
        ) : (
          <div className="notif-status">
            <p className="notif-hint">
              Get the coach's insights, weekly reviews, plan adjustments, and race reminders
              pushed straight to this device.
            </p>
            <button className="sync-btn" onClick={handleEnable} disabled={subscribe.isPending}>
              <Bell size={16} />
              {subscribe.isPending ? 'Enabling…' : 'Enable notifications'}
            </button>
          </div>
        )}
        {error && <span className="notif-error">{error}</span>}

        {prefs && (
          <ul className="notif-categories">
            {Object.entries(prefs.labels).map(([key, label]) => (
              <li key={key} className="notif-category-row">
                <label>
                  <input
                    type="checkbox"
                    checked={prefs.categories[key] ?? true}
                    onChange={e =>
                      setPrefs.mutate({ categories: { [key]: e.target.checked } })
                    }
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
