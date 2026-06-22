import { useEffect, useMemo, useRef, useState } from 'react'
import type { ActivityRoute } from '../../api/types'
import './RouteMap.css'

type Mode = 'solid' | 'hr' | 'pace' | 'power' | 'elevation'

interface MetricDef {
  mode: Mode
  label: string
  unit: string
  data: (number | null)[] | null
  reverse?: boolean   // map low value -> warm end (used for pace: faster = hotter)
}

interface Props {
  route: ActivityRoute | null | undefined
  activityColor: string
}

const TRACE_MS = 3500       // time to draw the full path
const LOOP_DELAY_MS = 1200  // pause before the animation repeats
const PADDING = 16
const LINE_WIDTH = 2.5

// Map a normalised value [0,1] to a blue -> red ramp.
function rampColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  const hue = 210 * (1 - clamped) // 210 (blue) -> 0 (red)
  return `hsl(${hue}, 80%, 52%)`
}

export default function RouteMap({ route, activityColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('solid')
  const [width, setWidth] = useState(0)

  // Keep only valid GPS points, carrying their original index so metric
  // streams (aligned 1:1 with route.points) stay matched up.
  const valid = useMemo(() => {
    if (!route?.points?.length) return null
    const pts: { lat: number; lng: number; idx: number }[] = []
    route.points.forEach((p, idx) => {
      if (p && typeof p[0] === 'number' && typeof p[1] === 'number') {
        pts.push({ lat: p[0], lng: p[1], idx })
      }
    })
    return pts.length >= 2 ? pts : null
  }, [route])

  // Available colour modes for the control row (solid always; metric only when
  // its stream has data).
  const metrics: MetricDef[] = useMemo(() => {
    if (!route) return []
    const hasData = (arr: (number | null)[] | null | undefined) =>
      !!arr && arr.some(v => v !== null && v !== undefined)
    const defs: MetricDef[] = [
      { mode: 'hr', label: 'HR', unit: 'bpm', data: route.hr ?? null },
      { mode: 'pace', label: 'Pace', unit: '/km', data: route.pace ?? null, reverse: true },
      { mode: 'power', label: 'Power', unit: 'W', data: route.power ?? null },
      { mode: 'elevation', label: 'Elev', unit: 'm', data: route.elevation ?? null },
    ]
    return defs.filter(d => hasData(d.data))
  }, [route])

  // Fall back to solid if the active metric isn't available for this activity.
  useEffect(() => {
    if (mode !== 'solid' && !metrics.some(m => m.mode === mode)) {
      setMode('solid')
    }
  }, [metrics, mode])

  // Track container width for a responsive, crisp canvas.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidth(w)
    })
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [valid])

  const height = 220

  // Project lat/lng to canvas pixels (equirectangular with cos(lat)
  // correction), fit to the canvas preserving aspect ratio.
  const projected = useMemo(() => {
    if (!valid || width <= 0) return null
    const centerLat = valid.reduce((s, p) => s + p.lat, 0) / valid.length
    const cos = Math.cos((centerLat * Math.PI) / 180)
    const raw = valid.map(p => ({ x: p.lng * cos, y: p.lat, idx: p.idx }))
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const r of raw) {
      if (r.x < minX) minX = r.x
      if (r.x > maxX) maxX = r.x
      if (r.y < minY) minY = r.y
      if (r.y > maxY) maxY = r.y
    }
    const spanX = maxX - minX || 1e-6
    const spanY = maxY - minY || 1e-6
    const scale = Math.min(
      (width - 2 * PADDING) / spanX,
      (height - 2 * PADDING) / spanY,
    )
    // Centre the route within the canvas.
    const offX = (width - spanX * scale) / 2
    const offY = (height - spanY * scale) / 2
    return raw.map(r => ({
      x: offX + (r.x - minX) * scale,
      y: height - (offY + (r.y - minY) * scale), // flip: north is up
      idx: r.idx,
    }))
  }, [valid, width])

  // Min/max of the active metric for normalisation + legend.
  const activeMetric = metrics.find(m => m.mode === mode) || null
  const range = useMemo(() => {
    if (!activeMetric?.data) return null
    const vals = activeMetric.data.filter((v): v is number => v !== null && v !== undefined)
    if (!vals.length) return null
    return { min: Math.min(...vals), max: Math.max(...vals) }
  }, [activeMetric])

  // Draw + animate.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !projected || projected.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.lineWidth = LINE_WIDTH
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    const segCount = projected.length - 1

    // Per-segment colour for the active metric (value at the segment's start
    // point, normalised across the activity's own range).
    const segColor = (i: number): string => {
      if (mode === 'solid' || !activeMetric?.data || !range) return activityColor
      const v = activeMetric.data[projected[i].idx]
      if (v === null || v === undefined) return activityColor
      const span = range.max - range.min || 1
      let t = (v - range.min) / span
      if (activeMetric.reverse) t = 1 - t
      return rampColor(t)
    }

    const drawMarker = (x: number, y: number, fill: string, r = 5) => {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#fff'
      ctx.stroke()
      ctx.lineWidth = LINE_WIDTH
    }

    const drawUpTo = (count: number) => {
      ctx.clearRect(0, 0, width, height)
      const n = Math.min(count, segCount)
      if (mode === 'solid') {
        // Single stroke for the whole drawn portion.
        ctx.strokeStyle = activityColor
        ctx.beginPath()
        ctx.moveTo(projected[0].x, projected[0].y)
        for (let i = 1; i <= n; i++) ctx.lineTo(projected[i].x, projected[i].y)
        ctx.stroke()
      } else {
        for (let i = 0; i < n; i++) {
          ctx.strokeStyle = segColor(i)
          ctx.beginPath()
          ctx.moveTo(projected[i].x, projected[i].y)
          ctx.lineTo(projected[i + 1].x, projected[i + 1].y)
          ctx.stroke()
        }
      }

      // Markers: start (always), then either the moving current position
      // (while tracing) or the finish marker (once the path is complete).
      const last = projected[segCount]
      drawMarker(projected[0].x, projected[0].y, '#2ecc71') // start (green)
      if (n >= segCount) {
        drawMarker(last.x, last.y, '#e74c3c') // finish (red)
      } else {
        drawMarker(projected[n].x, projected[n].y, activityColor, 4.5) // current position
      }
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      drawUpTo(segCount)
      return
    }

    let raf = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let start: number | null = null

    const frame = (ts: number) => {
      if (start === null) start = ts
      const progress = Math.min(1, (ts - start) / TRACE_MS)
      drawUpTo(Math.ceil(progress * segCount))
      if (progress < 1) {
        raf = requestAnimationFrame(frame)
      } else {
        timer = setTimeout(() => {
          start = null
          raf = requestAnimationFrame(frame)
        }, LOOP_DELAY_MS)
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      if (timer) clearTimeout(timer)
    }
  }, [projected, width, mode, activeMetric, range, activityColor])

  if (!valid) return null

  const fmt = (v: number) =>
    activeMetric?.mode === 'pace'
      ? `${Math.floor(v)}:${Math.round((v - Math.floor(v)) * 60).toString().padStart(2, '0')}`
      : Math.round(v).toString()

  return (
    <section className="detail-section">
      <h3 className="section-title">Route</h3>
      <div className="card route-card">
        <div className="route-modes">
          <button
            className={`route-mode ${mode === 'solid' ? 'active' : ''}`}
            onClick={() => setMode('solid')}
          >
            Solid
          </button>
          {metrics.map(m => (
            <button
              key={m.mode}
              className={`route-mode ${mode === m.mode ? 'active' : ''}`}
              onClick={() => setMode(m.mode)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="route-canvas-wrap" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="route-canvas"
            style={{ width: '100%', height }}
          />
        </div>
        {activeMetric && range && (
          <div className="route-legend">
            <span>{fmt(range.min)} {activeMetric.unit}</span>
            <div
              className="route-legend-bar"
              style={{
                background: activeMetric.reverse
                  ? `linear-gradient(to right, ${rampColor(1)}, ${rampColor(0)})`
                  : `linear-gradient(to right, ${rampColor(0)}, ${rampColor(1)})`,
              }}
            />
            <span>{fmt(range.max)} {activeMetric.unit}</span>
          </div>
        )}
      </div>
    </section>
  )
}
