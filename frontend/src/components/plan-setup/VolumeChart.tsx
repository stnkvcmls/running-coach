// SVG chart showing 3 volume progression curves; highlights the active one.
interface VolumeChartProps {
  active: 'gradual' | 'steady' | 'progressive'
}

const CURVES = {
  gradual: 'M 0 80 C 60 70, 120 50, 200 35 S 320 20, 380 18',
  steady: 'M 0 80 C 50 65, 110 42, 200 28 S 310 15, 380 12',
  progressive: 'M 0 80 C 45 58, 100 32, 200 20 S 305 10, 380 6',
} as const

const ORDER: Array<'gradual' | 'steady' | 'progressive'> = ['gradual', 'steady', 'progressive']

export default function VolumeChart({ active }: VolumeChartProps) {
  return (
    <svg viewBox="0 0 380 90" width="100%" style={{ display: 'block', background: 'var(--bg-input)', borderRadius: 8 }}>
      {/* Grid lines */}
      {[20, 40, 60].map(y => (
        <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="var(--border)" strokeWidth="0.8" />
      ))}
      {/* Dashed plan start/end lines */}
      <line x1="20" y1="0" x2="20" y2="90" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3 3" />
      <line x1="360" y1="0" x2="360" y2="90" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3 3" />
      <text x="20" y="88" fontSize="7" fill="var(--text-muted)" textAnchor="middle">START</text>
      <text x="360" y="88" fontSize="7" fill="var(--text-muted)" textAnchor="middle">END</text>

      {/* Curves — draw inactive first, active on top */}
      {ORDER.filter(k => k !== active).map(k => (
        <path key={k} d={CURVES[k]} fill="none" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
      ))}
      <path d={CURVES[active]} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
