import { useSkin } from '../../App'
import DotMatrix, { DOT_MATRIX_CHARS } from './DotMatrix'

interface Props {
  /** Digits, ':', '.', '-', '/', '%' and space are supported. */
  value: string
  /** Dot diameter in px, passed through to DotMatrix. */
  dot?: number
  /** Gap between dots in px, passed through to DotMatrix. */
  gap?: number
  /** Accessible text. Defaults to `value`. */
  label?: string
  /** Class applied to the plain-text span rendered in the default skin. */
  className?: string
}

/**
 * Skin-aware headline numeral. Nothing skins get a dot-matrix readout;
 * the default skin gets a plain span. Screens only ever reach for this —
 * never for DotMatrix directly — so no screen needs a skin conditional.
 */
export default function Numeral({ value, dot, gap, label, className }: Props) {
  const { skin } = useSkin()
  const isSupported = [...value].every(ch => DOT_MATRIX_CHARS.has(ch))
  if (skin.startsWith('nothing') && isSupported) {
    return <DotMatrix value={value} dot={dot} gap={gap} label={label} />
  }
  return <span className={className}>{value}</span>
}
