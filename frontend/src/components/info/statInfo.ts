/**
 * Explainer content for the Training Load and Training Readiness stats.
 *
 * This is a plain data module (no backend call). The descriptions, formulas and
 * limits restate the calculations implemented in `app/training_load.py` so the
 * user can understand what each number means. Every acronym is given both its
 * full expansion and a plain-language description of what it measures.
 */

export interface StatDetail {
  /** Full, human-readable name of the stat. */
  name: string
  /** Short form spelled out, e.g. "CTL (Chronic Training Load)". */
  acronym?: string
  /** What it is, in plain language — spelling out any acronyms it relies on. */
  description: string
  /** How it's calculated. */
  formula: string
  /** Sane ranges, interpretation bands, and caveats. */
  limits: string
}

export interface InfoTopic {
  title: string
  /** Optional lead-in shown under the page title. */
  intro?: string
  stats: StatDetail[]
}

export const STAT_INFO: Record<string, InfoTopic> = {
  'training-load': {
    title: 'Training Load',
    intro:
      'Training load tracks how much work you’ve done and how it’s balancing out over time. ' +
      'Every stat below is built from TSS (Training Stress Score) — a single number summarising ' +
      'how hard one session was, derived from its duration and intensity. When a run has no power ' +
      'data, TSS is estimated from pace, then heart rate, then duration, with the intensity factor ' +
      'capped at 1.50 so one fluky data point can’t blow up the load.',
    stats: [
      {
        name: 'Fitness',
        acronym: 'CTL (Chronic Training Load)',
        description:
          'Your long-term training load — roughly how much fitness you’ve built up over the past ' +
          '~6 weeks. It’s a 42-day EWMA (Exponentially-Weighted Moving Average: a rolling average ' +
          'that weights recent days more heavily than older ones) of your daily TSS (Training Stress ' +
          'Score). Higher means fitter.',
        formula:
          'CTL_today = CTL_yesterday + (TSS_today − CTL_yesterday) × α,  where α = 1 − e^(−1/42) ≈ 0.0235',
        limits:
          'Builds and decays slowly, so it needs several weeks of consistent data to be meaningful. ' +
          'Typical recreational range ~30–80; well-trained endurance athletes often exceed 100.',
      },
      {
        name: 'Fatigue',
        acronym: 'ATL (Acute Training Load)',
        description:
          'Your short-term training load — how much fatigue you’re carrying right now from recent ' +
          'sessions. It’s a 7-day EWMA (Exponentially-Weighted Moving Average) of your daily TSS ' +
          '(Training Stress Score), so it reacts quickly to hard days and rest days alike.',
        formula:
          'ATL_today = ATL_yesterday + (TSS_today − ATL_yesterday) × α,  where α = 1 − e^(−1/7) ≈ 0.1331',
        limits:
          'Rises and falls fast (days, not weeks). On its own it just tells you how loaded the last ' +
          'week was — it’s most useful compared against Fitness (see Form and ACWR).',
      },
      {
        name: 'Form',
        acronym: 'TSB (Training Stress Balance)',
        description:
          'Your freshness — the gap between long-term fitness and short-term fatigue. Positive Form ' +
          'means you’re rested and ready; negative Form means fatigue is outweighing fitness because ' +
          'you’re in a training block.',
        formula: 'TSB = CTL (Fitness) − ATL (Fatigue)',
        limits:
          'Interpretation bands: above +15 = very fresh / detraining risk; +5 to +15 = fresh, tapered; ' +
          '−10 to +5 = neutral, race-ready; −30 to −10 = productive training fatigue; below −30 = high ' +
          'fatigue / overreaching risk.',
      },
      {
        name: 'Workload Ratio',
        acronym: 'ACWR (Acute:Chronic Workload Ratio)',
        description:
          'A relative injury-risk gauge: how big your recent load (Fatigue) is compared with the load ' +
          'your body is accustomed to (Fitness). It flags when you’re ramping up too fast. Only shown ' +
          'once you have enough history for Fitness to be established.',
        formula: 'ACWR = ATL (Fatigue) ÷ CTL (Fitness),  shown only when CTL > 1',
        limits:
          'Risk bands: 0.8–1.3 = the “sweet spot” / optimal training zone; above 1.3 = moderate risk, ' +
          'monitor fatigue; above 1.5 = high risk / significant overreaching. Below 0.8 suggests ' +
          'detraining. A rapid 7-day rise in Fitness also bumps the risk rating.',
      },
    ],
  },

  'training-readiness': {
    title: 'Training Readiness',
    intro:
      'Readiness is a single 0–100 score estimating how prepared your body is to train hard today. ' +
      'It’s a weighted average of up to five wellness components (each scored 0–100). Any component ' +
      'with no data for the day is dropped and the remaining weights are rebalanced, so a partial ' +
      'data day still gives a meaningful score.',
    stats: [
      {
        name: 'Overall Readiness Score',
        description:
          'The headline 0–100 number. It’s the weighted average of the available components below: ' +
          'Sleep 25%, Recovery 25%, Freshness 20%, Resting HR 10%, HRV 20%.',
        formula:
          'score = Σ(component × weight) ÷ Σ(weights of available components)',
        limits:
          'Labels: 86–100 = Excellent; 71–85 = Very Good; 51–70 = Good; 31–50 = Fair; 0–30 = Low. ' +
          'It’s a guide, not a verdict — context (illness, life stress, race day) still matters.',
      },
      {
        name: 'Sleep',
        description:
          'How well you slept last night, combining sleep quality and quantity. Uses your device’s ' +
          'sleep score plus a score based purely on hours slept.',
        formula:
          'avg(device sleep score, duration score) — where duration score maps 5 h → 0 and 8 h → 100 linearly',
        limits:
          'Scored 0–100. Needs sleep tracking data; if neither a sleep score nor a duration is ' +
          'recorded, this component is omitted.',
      },
      {
        name: 'Recovery',
        description:
          'How recovered your nervous system looks, from all-day stress and Body Battery (your ' +
          'device’s energy-reserve estimate). Lower stress and higher Body Battery mean better recovery.',
        formula:
          'avg(100 − average stress, Body Battery high) — each clamped to 0–100',
        limits:
          'Scored 0–100. Requires stress and/or Body Battery data; omitted if neither is available.',
      },
      {
        name: 'Freshness',
        description:
          'How little training fatigue you’re carrying — the inverse of your short-term load. It’s ' +
          'derived directly from Fatigue (ATL, Acute Training Load, the 7-day load average used in ' +
          'Training Load). Higher means less fatigued.',
        formula: 'Freshness = 100 − ATL (Fatigue),  clamped to 0–100',
        limits:
          'Scored 0–100. Because it’s based on Fatigue, very heavy recent training pushes it toward 0.',
      },
      {
        name: 'Resting HR',
        acronym: 'RHR (Resting Heart Rate)',
        description:
          'Your lowest heart rate at rest, compared against your recent norm. An elevated resting ' +
          'heart rate often signals incomplete recovery, illness, or stress, so a lower-than-usual ' +
          'value scores higher.',
        formula:
          'score = 75 − delta × 7.5,  where delta = today’s RHR − 7-day average RHR (clamped 0–100). ' +
          'So −5 bpm → 100, 0 → 75, +10 bpm → 0.',
        limits:
          'Scored 0–100. Needs today’s resting HR plus a recent baseline to compare against; omitted ' +
          'otherwise. Lowest weight (10%) since RHR is noisy day to day.',
      },
      {
        name: 'HRV',
        acronym: 'HRV (Heart-Rate Variability)',
        description:
          'The beat-to-beat variation in your heart rate overnight — a well-established marker of ' +
          'recovery and autonomic balance. Measured against your own personal baseline rather than ' +
          'an absolute target, because healthy HRV varies a lot between people.',
        formula:
          'score = 75 + (ratio − 1) × 250,  where ratio = last-night HRV ÷ 7-day baseline HRV ' +
          '(clamped 0–100). Falls back to your device’s HRV status (Balanced/Unbalanced/Low/Poor) ' +
          'when no baseline exists.',
        limits:
          'Scored 0–100. At baseline → 75 (“good”); roughly +20% → 100, −20% → 25. Needs overnight ' +
          'HRV data; omitted if unavailable.',
      },
    ],
  },
}
