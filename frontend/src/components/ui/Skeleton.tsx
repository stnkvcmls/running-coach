import type { CSSProperties } from 'react'
import './Skeleton.css'

interface Props {
  height?: number | string
  width?: number | string
  radius?: number | string
}

export default function Skeleton({ height = '1em', width = '100%', radius = 'var(--radius-xs)' }: Props) {
  const style: CSSProperties = { height, width, borderRadius: radius }
  return <span className="skeleton" style={style} aria-hidden="true" />
}
