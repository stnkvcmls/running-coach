import type { CSSProperties } from 'react'
import './DotMatrix.css'

// 5x7 bitmaps, one row per string of 5 bits ('1' = lit).
const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['00000', '00110', '00110', '00000', '00110', '00110', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  ',': ['00000', '00000', '00000', '00000', '00000', '01100', '01000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}

const BLANK = GLYPHS[' ']

/** Characters DotMatrix can render as dots. Numeral uses this to decide whether to fall back to plain text. */
export const DOT_MATRIX_CHARS = new Set(Object.keys(GLYPHS))

interface Props {
  /** Digits, ':', '.', '-', '/', '%' and space are supported. */
  value: string
  /** Dot diameter in px. Default 3. */
  dot?: number
  /** Gap between dots in px. Default 2. */
  gap?: number
  /** Accessible text. Defaults to `value`. */
  label?: string
}

export default function DotMatrix({ value, dot = 3, gap = 2, label }: Props) {
  const style = {
    '--dm-d': `${dot}px`,
    '--dm-s': `${gap}px`,
    '--dm-gap': `${dot + gap * 1.5}px`,
  } as CSSProperties

  return (
    <span role="img" aria-label={label ?? value} className="dot-matrix" style={style}>
      <span className="dot-matrix-grid" aria-hidden="true">
        {[...value].map((ch, i) => {
          const rows = GLYPHS[ch] ?? BLANK
          return (
            <span className="dm-char" key={i}>
              {rows.map((row, r) =>
                [...row].map((bit, c) => (
                  <i className={`dm-dot${bit === '1' ? ' on' : ''}`} key={`${r}-${c}`} />
                )),
              )}
            </span>
          )
        })}
      </span>
    </span>
  )
}
