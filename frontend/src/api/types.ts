export interface UserResponse {
  email: string
  full_name: string | null
}

export interface ActivitySummary {
  id: number
  garmin_id: number | null
  activity_type: string | null
  name: string | null
  started_at: string | null
  duration_sec: number | null
  distance_m: number | null
  avg_hr: number | null
  max_hr: number | null
  avg_pace_min_km: number | null
  calories: number | null
  elevation_gain: number | null
}

export interface InsightResponse {
  id: number
  created_at: string | null
  trigger_type: string | null
  trigger_id: number | null
  content: string | null
  summary: string | null
  category: string | null
}

export interface FeedbackRequest {
  rating: 'good' | 'bad'
  tags?: string[]
  text?: string
}

export interface GarminCredentialsRequest {
  email: string
  password: string
}

export interface GarminConnectResult {
  status: 'connected' | 'mfa_required'
}

export interface GarminConnectionStatus {
  connected: boolean
  garmin_email: string | null
  mfa_pending: boolean
}

export interface IntervalAdherence {
  step_order: number
  label: string                            // "Warmup", "Interval 1", "Recovery 2", "Cooldown"
  step_type: string                        // warmup, interval, rest, cooldown, …
  planned_distance_m: number | null
  actual_distance_m: number | null
  planned_pace_display: string | null
  actual_pace_display: string | null
  pace_delta_sec_per_km: number | null     // positive = slower than plan
  distance_delta_m: number | null          // actual - planned
  matched: boolean                         // a lap aligned to this step
}

export interface WorkoutAdherence {
  planned_distance_m: number | null        // running periods only (rest excluded)
  planned_rest_distance_m: number | null
  actual_distance_m: number | null         // running distance (rest excluded)
  actual_rest_distance_m: number | null    // distance covered during rest laps
  distance_pct: number | null
  planned_pace_display: string | null
  actual_pace_display: string | null
  pace_delta_sec_per_km: number | null  // positive = slower than planned
  planned_intervals: number | null
  actual_laps: number | null
  adherence_score: number              // 0–100
  summary: string
  intervals: IntervalAdherence[] | null  // per-rep lap↔step alignment
}

export interface ActivityDetail extends ActivitySummary {
  elevation_loss: number | null
  max_elevation: number | null
  min_elevation: number | null
  avg_cadence: number | null
  max_cadence: number | null
  avg_stride: number | null
  training_effect_aerobic: number | null
  training_effect_anaerobic: number | null
  vo2max: number | null
  avg_power: number | null
  normalized_power: number | null
  training_stress_score: number | null
  intensity_factor: number | null
  avg_ground_contact_time: number | null
  avg_vertical_oscillation: number | null
  avg_vertical_ratio: number | null
  avg_speed: number | null
  max_speed: number | null
  min_hr: number | null
  avg_respiration_rate: number | null
  max_respiration_rate: number | null
  run_time_sec: number | null
  walk_time_sec: number | null
  splits: any
  hr_zones: any
  weather: any
  power_zones: any
  chart_data: Record<string, ChartSeries> | null
  metric_zones: Record<string, MetricZone[]> | null
  feedback_rating: string | null
  feedback_tags: string[] | null
  feedback_text: string | null
  insight: InsightResponse | null
  scheduled_workout: CalendarEvent | null
  adherence: WorkoutAdherence | null
}

export interface ChartSeries {
  label: string
  unit: string
  data: (number | null)[]
}

export interface MetricZone {
  metric_key: string
  zone_name: string
  zone_color: string
  percentile_label: string
  min_value: number | null
  max_value: number | null
}

export interface DailySummaryResponse {
  id: number
  date: string
  steps: number | null
  total_calories: number | null
  active_calories: number | null
  resting_hr: number | null
  max_hr: number | null
  stress_avg: number | null
  sleep_seconds: number | null
  sleep_score: number | null
  body_battery_high: number | null
  body_battery_low: number | null
  intensity_minutes: number | null
  floors_climbed: number | null
  hrv_avg: number | null
  hrv_weekly_avg: number | null
  hrv_status: string | null
}

export interface DailySummaryDetail {
  summary: DailySummaryResponse
  activities: ActivitySummary[]
  insight: InsightResponse | null
}

export interface WorkoutStep {
  step_order: number
  step_type: string
  end_condition: string | null
  end_condition_value: number | null
  end_condition_display: string | null
  target_type: string | null
  target_display: string | null
  description: string | null
  activity_type: string | null
  repeat_count: number | null
  steps: WorkoutStep[] | null
}

export interface CalendarEvent {
  id: number
  event_type: string | null
  date: string
  title: string | null
  distance_m: number | null
  distance_label: string | null
  goal_time_sec: number | null
  priority: string | null
  workout_type: string | null
  workout_description: string | null
  workout_steps: WorkoutStep[] | null
}

export interface CalendarDay {
  date: string
  activities: ActivitySummary[]
  events: CalendarEvent[]
}

export interface WeeklyMileage {
  label: string
  km: number
  by_type: Record<string, number>  // activity category -> km
}

export interface RaceInfo {
  id: number
  title: string | null
  date: string
  distance_label: string | null
  days_away: number
  goal_time_sec: number | null
  priority: string | null
}

export interface TrainingLoadPoint {
  date: string
  tss: number
  ctl: number  // Fitness (42-day EWMA)
  atl: number  // Fatigue (7-day EWMA)
  tsb: number  // Form (CTL − ATL)
  acwr: number | null  // Acute:Chronic Workload Ratio
  ramp_rate_7d: number | null
  ramp_rate_28d: number | null
  injury_risk: string | null  // "low" | "moderate" | "high"
}

export interface TrainingReadiness {
  score: number
  label: string
  sleep_component: number | null
  recovery_component: number | null
  fatigue_component: number | null
  rhr_component: number | null
  hrv_component: number | null
}

export interface TrainingLoadResponse {
  points: TrainingLoadPoint[]
  current: TrainingLoadPoint | null
}

export interface TodayResponse {
  selected_date: string
  activities: ActivitySummary[]
  daily_summary: DailySummaryResponse | null
  weekly_data: WeeklyMileage[]
  insights: InsightResponse[]
  next_races: RaceInfo[]
  scheduled_events: CalendarEvent[]
  training_load: TrainingLoadPoint | null
  readiness: TrainingReadiness | null
}

export interface SettingsResponse {
  sync_statuses: Record<string, { value: string; updated_at: string | null }>
  counts: Record<string, number>
}

export interface AiConfigResponse {
  provider: string
  model: string
  available_providers: string[]
  available_models: Record<string, string[]>
}

export interface AiConfigRequest {
  provider: string
  model: string
}

export interface AthleteProfile {
  id: number
  name: string | null
  date_of_birth: string | null
  age: number | null
  weight_kg: number | null
  goal_race: string | null
  goal_race_date: string | null
  threshold_pace_min_km: number | null
  threshold_hr: number | null
  threshold_power: number | null
  max_hr: number | null
  resting_hr: number | null
  injury_history: string | null
  weekly_availability: string | null
  training_preferences: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AthleteProfileRequest {
  name?: string | null
  date_of_birth?: string | null
  weight_kg?: number | null
  goal_race?: string | null
  goal_race_date?: string | null
  threshold_pace_min_km?: number | null
  threshold_hr?: number | null
  threshold_power?: number | null
  max_hr?: number | null
  resting_hr?: number | null
  injury_history?: string | null
  weekly_availability?: string | null
  training_preferences?: string | null
}

export interface ZoneConfig {
  id: number
  zone_type: string
  zone_number: number
  zone_name: string
  zone_color: string
  min_pct: number | null
  max_pct: number | null
  computed_min: number | null
  computed_max: number | null
}

export interface ZoneConfigUpdate {
  zone_type: string
  zone_number: number
  zone_name?: string | null
  zone_color?: string | null
  min_pct?: number | null
  max_pct?: number | null
}

export interface ZoneConfigBulkUpdate {
  zones: ZoneConfigUpdate[]
}

export interface ZoneConfigsResponse {
  hr: ZoneConfig[]
  pace: ZoneConfig[]
  power: ZoneConfig[]
  threshold_hr: number | null
  threshold_pace_min_km: number | null
  threshold_power: number | null
}

export interface ThresholdEstimateField {
  value: number | null
  method: string | null
  confidence: string | null
  sample_size: number
  note: string | null
}

export interface ThresholdEstimateResponse {
  critical_power: ThresholdEstimateField
  w_prime: number | null
  pmax: number | null
  threshold_pace_min_km: ThresholdEstimateField
  threshold_hr: ThresholdEstimateField
  max_hr: ThresholdEstimateField
  lookback_days: number
  activities_analyzed: number
  current_threshold_power: number | null
  current_threshold_pace_min_km: number | null
  current_threshold_hr: number | null
  current_max_hr: number | null
}

export interface ThresholdApplyRequest {
  fields?: string[] | null
}

export interface TrainingPlanDay {
  id: number
  plan_id: number
  day_date: string
  day_of_week: string
  week_number: number
  workout_type: string  // easy | tempo | long | interval | rest | cross
  target_distance_m: number | null
  target_pace_min_km: number | null
  target_pace_display: string | null
  description: string | null
  notes: string | null
  week_theme: string | null
}

export interface TrainingPlanWeek {
  week_number: number
  week_start: string
  week_end: string
  theme: string | null
  days: TrainingPlanDay[]
}

export interface TrainingPlanResponse {
  id: number
  generated_at: string
  week_start: string
  plan_weeks: number
  phase: string | null
  overview: string | null
  weeks: TrainingPlanWeek[]
}

export interface MissedPlanSession {
  date: string
  workout_type: string
  target_distance_km: number | null
}

export interface PlanRealignmentStatus {
  should_prompt: boolean
  missed_count: number
  total_scheduled: number
  missed_sessions: MissedPlanSession[]
}

export interface PerformanceCurvePoint {
  duration_sec: number
  actual_value: number
  model_value: number | null
}

export interface RacePrediction {
  distance_label: string
  distance_m: number
  predicted_time_sec: number
  predicted_pace_min_km: number
}

export interface PerformanceCurveResponse {
  power_points: PerformanceCurvePoint[]
  pace_points: PerformanceCurvePoint[]
  critical_power: number | null
  w_prime: number | null
  critical_velocity: number | null
  d_prime: number | null
  race_predictions: RacePrediction[]
  lookback_days: number
  activities_analyzed: number
}

export interface IntensityWeek {
  week_start: string
  zone_seconds: Record<string, number>  // zone_number (as string) → seconds
  total_seconds: number
  easy_pct: number | null   // zones 1–2
  moderate_pct: number | null  // zone 3
  hard_pct: number | null   // zones 4–5
}

export interface IntensityTrendsResponse {
  weeks: IntensityWeek[]
  zone_type: string
  days: number
}
