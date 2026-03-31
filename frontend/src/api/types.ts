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
}

export interface TodayResponse {
  selected_date: string
  activities: ActivitySummary[]
  daily_summary: DailySummaryResponse | null
  weekly_data: WeeklyMileage[]
  insights: InsightResponse[]
  next_race: RaceInfo | null
  scheduled_events: CalendarEvent[]
}

export interface SettingsResponse {
  sync_statuses: Record<string, { value: string; updated_at: string | null }>
  counts: Record<string, number>
}
