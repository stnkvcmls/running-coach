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

  'activity-performance': {
    title: 'Activity Performance',
    intro:
      'These metrics describe the physiological stimulus of a single run — how aerobic, how ' +
      'anaerobic, how aerobically efficient you were, and whether your heart rate stayed in sync ' +
      'with your effort throughout.',
    stats: [
      {
        name: 'Aerobic Training Effect',
        acronym: 'Aerobic TE',
        description:
          'How much this run contributed to improving or maintaining your aerobic fitness. ' +
          'Computed by your Garmin device from the combination of heart-rate intensity and ' +
          'duration. A score of 3–4 is a productive aerobic workout; 5 indicates an overreaching ' +
          'effort that should be followed by extra recovery.',
        formula: 'Proprietary Garmin algorithm based on EPOC (Excess Post-exercise Oxygen Consumption) and HR-based intensity',
        limits:
          '0.0–1.9 = minor / recovery stimulus; 2.0–2.9 = maintaining fitness; 3.0–3.9 = improving; ' +
          '4.0–4.9 = highly improving; 5.0 = overreaching. Needs a heart-rate monitor.',
      },
      {
        name: 'Anaerobic Training Effect',
        acronym: 'Anaerobic TE',
        description:
          'How much this run contributed to improving your speed and high-intensity capacity ' +
          'by stressing the anaerobic energy system. High-anaerobic TE appears on interval and ' +
          'tempo sessions; easy runs score near zero. Complements Aerobic TE — the two together ' +
          'describe the full physiological demand of a session.',
        formula: 'Proprietary Garmin algorithm based on above-threshold heart-rate time and intensity',
        limits:
          '0.0–0.9 = no anaerobic stimulus; 1.0–1.9 = minor; 2.0–2.9 = maintaining; ' +
          '3.0–3.9 = improving; 4.0–4.9 = highly improving; 5.0 = overreaching.',
      },
      {
        name: 'VO2max Estimate',
        acronym: 'VO2max (maximal oxygen uptake)',
        description:
          'An estimate of your aerobic ceiling — the maximum rate at which your body can ' +
          'use oxygen during exercise, in ml/kg/min. Garmin derives it by comparing your speed ' +
          'and heart rate during outdoor GPS runs (GPS + heart rate required; treadmill and ' +
          'indoor runs are excluded). The number improves gradually as fitness builds — ' +
          'a single run can shift it only slightly, but the trend over weeks is meaningful.',
        formula: 'Proprietary Garmin/Firstbeat algorithm: inferred from the speed-to-HR relationship over multiple runs',
        limits:
          'Values are age- and sex-dependent. Broad reference bands (all ages, male/female combined): ' +
          '< 34 = poor; 34–42 = below average; 42–50 = average; 50–58 = above average; ' +
          '58–65 = excellent; > 65 = elite. Requires consistent outdoor GPS running to be reliable.',
      },
      {
        name: 'Aerobic Decoupling',
        acronym: 'Pa:HR Decoupling (%)',
        description:
          'How much your heart rate drifted upward relative to your pace (or power) between ' +
          'the first and second halves of the run — a measure of cardiac drift and aerobic ' +
          'durability. A well-coupled run means your aerobic system handled the effort; a ' +
          'high value means you were working progressively harder to hold the same pace.',
        formula:
          'decoupling = (first-half ratio − second-half ratio) ÷ first-half ratio × 100,  ' +
          'where ratio = time-weighted avg GAP-speed ÷ avg HR for each half',
        limits:
          '< 3% = excellent aerobic durability; 3–5% = good, typical for a well-paced aerobic run; ' +
          '5–8% = moderate cardiac drift; > 8% = significant drift — suggests the effort ' +
          'exceeded aerobic threshold, the run was too long given fitness, or conditions were ' +
          'unusually hot. Computed only for runs of 10 min or more with GPS and HR data.',
      },
      {
        name: 'Efficiency Factor',
        acronym: 'EF (Efficiency Factor)',
        description:
          'Average GAP-speed (grade-adjusted pace, converted to m/s) divided by average ' +
          'heart rate for the entire run — a measure of aerobic economy. A rising EF over ' +
          'similar efforts over weeks signals improving aerobic fitness. Compare across ' +
          'runs at the same effort level, not across hard and easy days.',
        formula:
          'EF = avg GAP-speed (m/s) ÷ avg HR (bpm),  displayed as mm/s per bpm (× 1000). ' +
          'Falls back to raw GPS speed when elevation data is unavailable.',
        limits:
          'Absolute values vary by athlete and conditions; trend matters more than the number ' +
          'itself. Higher is better at the same relative effort. Compare easy runs with easy ' +
          'runs, threshold with threshold. Computed only when GPS and HR streams are present.',
      },
    ],
  },

  'performance-curve': {
    title: 'Performance Curve',
    intro:
      'The performance curve (also called a mean-maximal or power-duration curve) shows the best ' +
      'sustained pace or power achieved over a range of durations within the selected time window. ' +
      'A two-parameter model is then fit to that frontier to derive physiological benchmarks ' +
      'and race time predictions.',
    stats: [
      {
        name: 'Mean-Maximal Curve',
        description:
          'For each standard duration (5 s to 90 min) the app finds the single best time-weighted ' +
          'average pace or power you achieved anywhere within any activity in the window. Together ' +
          'these "frontier best" points form the mean-maximal curve — the upper envelope of what ' +
          'you can sustain.',
        formula:
          'best(d) = max over all windows of length d of: Σ(value × dt) ÷ Σ(dt)',
        limits:
          'Meaningful only when you have at least a few activities with full GPS or power stream data. ' +
          'Maximal efforts for short durations (< 2 min) need dedicated speed or interval sessions — ' +
          'easy runs leave those points blank.',
      },
      {
        name: 'Critical Velocity',
        acronym: 'CV (Critical Velocity)',
        description:
          'The highest sustainable aerobic running speed — essentially your running "threshold pace". ' +
          'Estimated by fitting a two-parameter (hyperbolic) model to the mean-maximal pace curve. ' +
          'It represents the asymptote the curve approaches as duration grows: the speed you could ' +
          'theoretically hold forever on fresh legs.',
        formula:
          'speed(d) = CV + D′ ÷ d  →  CV is the slope (m/s), D′ is the y-intercept offset (m)',
        limits:
          'Requires efforts at multiple durations for a stable fit — at least a few runs with varied ' +
          'pace including something near threshold. Displayed as pace (min/km) for readability. ' +
          'Confidence rises with more activities in the window.',
      },
      {
        name: 'D′',
        acronym: 'D′ (Distance Prime)',
        description:
          'The finite anaerobic distance capacity above Critical Velocity — the total distance ' +
          '"budget" you can run faster than CV before exhaustion forces you back below it. ' +
          'Once spent it recovers slowly during sub-CV running. The pace analogue of W′ (work ' +
          'capacity above Critical Power).',
        formula: 'D′ = (speed(d) − CV) × d,  solved from the two-parameter CV fit (units: metres)',
        limits:
          'Typical recreational range: 100–400 m. A larger D′ means you can sustain surges and ' +
          'short hard efforts longer before blowing up. Noisy until you have several near-maximal ' +
          'short efforts in the data.',
      },
      {
        name: 'Critical Power',
        acronym: 'CP (Critical Power)',
        description:
          'The highest power output that can be sustained aerobically — the power equivalent of ' +
          'Critical Velocity. Only shown when your activities include running power data (from a ' +
          'Garmin running dynamics pod or foot pod). Analogous to cycling FTP but derived from ' +
          'multi-duration maximal efforts rather than a single test.',
        formula:
          'power(d) = CP + W′ ÷ d  →  CP is the asymptote (W), W′ is the finite work capacity (J)',
        limits:
          'Requires power stream data across multiple durations. Displayed alongside W′ (kJ). ' +
          'Absent if no power data is available in the selected window.',
      },
      {
        name: 'W′',
        acronym: 'W′ (W-Prime / Anaerobic Work Capacity)',
        description:
          'The finite anaerobic energy reserve above Critical Power — the total extra work ' +
          '(in joules) you can do above CP before exhaustion. Once depleted it recovers when ' +
          'power drops below CP. The power analogue of D′.',
        formula: 'W′ = (power(d) − CP) × d,  solved from the CP two-parameter fit (units: joules)',
        limits:
          'Displayed in kJ. Typical trained recreational range: 15–30 kJ. Like D′, it stabilises ' +
          'once the data includes genuine short-duration maximal efforts.',
      },
      {
        name: 'Race Predictions',
        description:
          'Estimated finish times for standard distances (5 K, 10 K, Half Marathon, Marathon) ' +
          'derived from the Critical Velocity model. For each distance the model solves for the ' +
          'duration at which average speed equals CV + D′ / duration.',
        formula:
          'time(dist) = D′ ÷ (target_speed − CV),  where target_speed satisfies dist = target_speed × time(dist)',
        limits:
          'Predictions assume ideal conditions and fully fresh legs. They get more accurate as more ' +
          'varied-effort runs enter the window. They are most reliable close to race distances you ' +
          'have actually trained at — extrapolating to the marathon from only 5-km efforts ' +
          'is speculative.',
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
