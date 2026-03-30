import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Loader } from 'lucide-react'
import { useActivity, useTriggerAnalysis } from '../../api/hooks'
import { getActivityColor, colorMap } from '../../utils/colors'
import { formatDistance, formatDuration, formatPace } from '../../utils/formatting'
import { format, parseISO } from '../../utils/date'
import StatGrid from './StatGrid'
import ChartTabs from './ChartTabs'
import HrZonesChart from './HrZonesChart'
import LapsTable from './LapsTable'
import AiInsightCard from './AiInsightCard'
import FeedbackPrompt from './FeedbackPrompt'
import WorkoutSteps from '../today/WorkoutSteps'
import './ActivityDetailView.css'

export default function ActivityDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: activity, isLoading } = useActivity(Number(id) || 0)
  const triggerAnalysis = useTriggerAnalysis()

  if (isLoading) return <div className="spinner" />
  if (!activity) return <div className="empty-state">Activity not found</div>

  const colorType = getActivityColor(activity.name, activity.activity_type)
  const color = colorMap[colorType]
  const typeLabel = colorType === 'default'
    ? (activity.activity_type || 'Activity')
    : colorType.charAt(0).toUpperCase() + colorType.slice(1)

  const primaryStats = [
    { label: 'Distance', value: formatDistance(activity.distance_m), unit: 'km' },
    { label: 'Duration', value: formatDuration(activity.duration_sec) },
    { label: 'Avg Pace', value: formatPace(activity.avg_pace_min_km), unit: '/km' },
  ]

  const secondaryStats = [
    activity.avg_hr ? { label: 'Avg HR', value: String(activity.avg_hr), unit: 'bpm' } : null,
    activity.max_hr ? { label: 'Max HR', value: String(activity.max_hr), unit: 'bpm' } : null,
    activity.elevation_gain ? { label: 'Elev. Gain', value: `${Math.round(activity.elevation_gain)}`, unit: 'm' } : null,
    activity.calories ? { label: 'Calories', value: String(Math.round(activity.calories)), unit: 'kcal' } : null,
    activity.avg_cadence ? { label: 'Cadence', value: String(Math.round(activity.avg_cadence * 2)), unit: 'spm' } : null,
    activity.avg_stride ? { label: 'Stride', value: activity.avg_stride.toFixed(2), unit: 'm' } : null,
  ].filter(Boolean) as { label: string; value: string; unit?: string }[]

  const dynamicsStats = [
    activity.avg_ground_contact_time ? { label: 'GCT', value: String(Math.round(activity.avg_ground_contact_time)), unit: 'ms' } : null,
    activity.avg_vertical_oscillation ? { label: 'Vert. Osc.', value: activity.avg_vertical_oscillation.toFixed(1), unit: 'cm' } : null,
    activity.avg_vertical_ratio ? { label: 'Vert. Ratio', value: activity.avg_vertical_ratio.toFixed(1), unit: '%' } : null,
  ].filter(Boolean) as { label: string; value: string; unit?: string }[]

  const powerStats = [
    activity.avg_power ? { label: 'Avg Power', value: String(Math.round(activity.avg_power)), unit: 'W' } : null,
    activity.normalized_power ? { label: 'NP', value: String(Math.round(activity.normalized_power)), unit: 'W' } : null,
    activity.training_stress_score ? { label: 'TSS', value: activity.training_stress_score.toFixed(0) } : null,
    activity.intensity_factor ? { label: 'IF', value: activity.intensity_factor.toFixed(2) } : null,
  ].filter(Boolean) as { label: string; value: string; unit?: string }[]

  const perfStats = [
    activity.training_effect_aerobic ? { label: 'Aerobic TE', value: activity.training_effect_aerobic.toFixed(1) } : null,
    activity.training_effect_anaerobic ? { label: 'Anaerobic TE', value: activity.training_effect_anaerobic.toFixed(1) } : null,
    activity.vo2max ? { label: 'VO2max', value: activity.vo2max.toFixed(1) } : null,
  ].filter(Boolean) as { label: string; value: string; unit?: string }[]

  return (
    <div className="activity-detail">
      {/* Header */}
      <header className="detail-header" style={{ borderBottomColor: color }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-header-info">
          <span className="badge" style={{ background: `${color}22`, color }}>{typeLabel}</span>
          <h1 className="detail-title">{activity.name || 'Workout'}</h1>
          {activity.started_at && (
            <span className="detail-date">{format(parseISO(activity.started_at), 'EEEE, d MMMM yyyy, HH:mm')}</span>
          )}
        </div>
      </header>

      <div className="detail-body">
        {/* Primary stats */}
        <StatGrid stats={primaryStats} columns={3} large />

        {/* Workout Description */}
        {activity.scheduled_workout?.workout_steps && activity.scheduled_workout.workout_steps.length > 0 && (
          <section className="detail-section">
            <h3 className="section-title">Description</h3>
            <div className="card workout-description-card">
              <WorkoutSteps steps={activity.scheduled_workout.workout_steps} />
            </div>
          </section>
        )}

        {/* Secondary stats */}
        {secondaryStats.length > 0 && <StatGrid stats={secondaryStats} columns={3} />}

        {/* Running dynamics */}
        {dynamicsStats.length > 0 && (
          <section className="detail-section">
            <h3 className="section-title">Running Dynamics</h3>
            <StatGrid stats={dynamicsStats} columns={3} />
          </section>
        )}

        {/* Power */}
        {powerStats.length > 0 && (
          <section className="detail-section">
            <h3 className="section-title">Power</h3>
            <StatGrid stats={powerStats} columns={4} />
          </section>
        )}

        {/* Performance */}
        {perfStats.length > 0 && (
          <section className="detail-section">
            <h3 className="section-title">Performance</h3>
            <StatGrid stats={perfStats} columns={3} />
          </section>
        )}

        {/* HR Zones */}
        {activity.hr_zones && <HrZonesChart zones={activity.hr_zones} />}

        {/* Time-series charts */}
        {activity.chart_data && Object.keys(activity.chart_data).length > 0 && (
          <section className="detail-section">
            <ChartTabs chartData={activity.chart_data} metricZones={activity.metric_zones} />
          </section>
        )}

        {/* Splits / Laps */}
        {activity.splits && <LapsTable splits={activity.splits} />}

        {/* AI Insight / Feedback */}
        {activity.insight ? (
          <AiInsightCard
            insight={activity.insight}
            onReanalyze={() => triggerAnalysis.mutate(activity.id)}
            isAnalyzing={triggerAnalysis.isPending}
          />
        ) : activity.feedback_rating ? (
          <section className="detail-section">
            <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Loader size={18} style={{ animation: 'feedback-spin 1s linear infinite' }} />
                <span>Generating insights...</span>
              </div>
            </div>
          </section>
        ) : (
          <FeedbackPrompt activityId={activity.id} />
        )}
      </div>
    </div>
  )
}
