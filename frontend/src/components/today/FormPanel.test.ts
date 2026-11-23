import { describe, it, expect } from 'vitest'
import { formSentence, formWord } from './FormPanel'
import type { TrainingLoadPoint } from '../../api/types'

function point(ctl: number, atl: number, label: string | null): TrainingLoadPoint {
  return {
    date: '2026-07-09', tss: 0, ctl, atl, tsb: ctl - atl, acwr: null, ramp_rate_7d: null, ramp_rate_28d: null,
    injury_risk: null, form_zone: null, form_zone_label: label, rsb_zone: null, rsb_zone_label: null,
    rsb_recommendation: null, sport_breakdown: null,
  }
}

describe('Form sentence', () => {
  it('takes the head of the server band label', () => {
    expect(formWord(point(62, 45, 'Fresh, tapered'))).toBe('Fresh')
    expect(formWord(point(62, 40, 'Very fresh — detraining risk'))).toBe('Very fresh')
    expect(formWord(point(50, 70, 'Productive training fatigue'))).toBe('Productive training fatigue')
  })

  it('describes how fitness and fatigue moved over the week', () => {
    const s = formSentence(point(62, 44, 'Very fresh — detraining risk'), point(61.5, 60, null))
    expect(s.lead).toBe('Very fresh, +18.')
    expect(s.rest).toBe('Fitness is holding at 62 and fatigue has dropped to 44.')
  })
})

