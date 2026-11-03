import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trophy } from 'lucide-react'
import { useActivity, useTriggerAnalysis, useJobStatus } from '../../api/hooks'
import { getActivityColor, getActivityAccent } from '../../utils/colors'
import { formatDistance, formatPace } from '../../utils/formatting'
import { format, parseISO } from '../../utils/date'
import StatGrid from './StatGrid'
import RouteMap from './RouteMap'
import ChartTabs from './ChartTabs'
import HrZonesChart from './HrZonesChart'
import PaceZonesChart from './PaceZonesChart'
import SplitsBars from './SplitsBars'
import FeedbackPrompt from './FeedbackPrompt'
import AdherenceCard from './AdherenceCard'
import HeadlinePanel from './HeadlinePanel'
import RepsPanel from './RepsPanel'
import { repsFromAdherence } from '../ui/RepChart'
import { sampleDistancesKm, stepWindows } from './runAnalysis'
import StatHelpButton from '../info/StatHelpButton'
import { toast } from '../ui/Toast'
import { celebrateNewRecords } from '../../utils/records'
import './ActivityDetailView.css'

type Stat = { label: string; value: string; unit?: string }

export default function ActivityDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: activity, isLoading } = useActivity(Number(id) || 0)
  const triggerAnalysis = useTriggerAnalysis()
  const [analysisJobId, setAnalysisJobId] = useState<number | null>(null)
  const { data: analysisJob } = useJobStatus(analysisJobId)
  const [showAllStats, setShowAllStats] = useState(false)
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  const isAnalyzing =
    triggerAnalysis.isPending ||
    (analysisJobId != null && analysisJob?.status !== 'done' && analysisJob?.status !== 'failed')

  useEffect(() => {
    if (analysisJob?.status === 'done' || analysisJob?.status === 'failed') {
      if (analysisJob.status === 'failed') toast('Re-analysis failed — try again', { kind: 'error' })
      qc.invalidateQueries({ queryKey: ['activity', Number(id) || 0] })
      setAnalysisJobId(null)
    }
  }, [analysisJob?.status, id, qc])

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [activity?.id])

  useEffect(() => {
    celebrateNewRecords(activity?.personal_records)
  }, [activity?.personal_records])

  function handleReanalyze() {
    triggerAnalysis.mutate(activity!.id, {
      onSuccess: (data) => { if (data?.job_id) setAnalysisJobId(data.job_id) },
    })
  }

  if (isLoading) return <div className="spinner" />
  if (!activity) return <div className="empty-state">Activity not found</div>

  const colorType = getActivityColor(activity.name, activity.activity_type)
  const color = getActivityAccent(activity.name, activity.activity_type)
  const typeLabel = colorType === 'default'
    ? (activity.activity_type || 'Activity')
    : colorType.charAt(0).toUpperCase() + colorType.slice(1)

  const secondaryStats = [
    activity.avg_hr ? { label: 'Avg HR', value: String(activity.avg_hr), unit: 'bpm' } : null,
    activity.max_hr ? { label: 'Max HR', value: String(activity.max_hr), unit: 'bpm' } : null,
    activity.elevation_gain ? { label: 'Elev. gain', value: `${Math.round(activity.elevation_gain)}`, unit: 'm' } : null,
    activity.calories ? { label: 'Calories', value: String(Math.round(activity.calories)), unit: 'kcal' } : null,
    activity.avg_cadence ? { label: 'Cadence', value: String(Math.round(activity.avg_cadence)), unit: 'spm' } : null,
    activity.avg_stride ? { label: 'Stride', value: activity.avg_stride.toFixed(2), unit: 'm' } : null,
    activity.rpe != null ? { label: 'Effort', value: String(activity.rpe), unit: 'of 10' } : null,
  ].filter(Boolean) as Stat[]

  const dynamicsStats = [
    activity.avg_ground_contact_time ? { label: 'GCT', value: String(Math.round(activity.avg_ground_contact_time)), unit: 'ms' } : null,
    activity.avg_vertical_oscillation ? { label: 'Vert. osc.', value: activity.avg_vertical_oscillation.toFixed(1), unit: 'cm' } : null,
    activity.avg_vertical_ratio ? { label: 'Vert. ratio', value: activity.avg_vertical_ratio.toFixed(1), unit: '%' } : null,
  ].filter(Boolean) as Stat[]

  const powerStats = [
    activity.avg_power ? { label: 'Avg power', value: String(Math.round(activity.avg_power)), unit: 'W' } : null,
    activity.normalized_power ? { label: 'NP', value: String(Math.round(activity.normalized_power)), unit: 'W' } : null,
    activity.training_stress_score ? { label: 'TSS', value: activity.training_stress_score.toFixed(0) } : null,
    activity.intensity_factor ? { label: 'IF', value: activity.intensity_factor.toFixed(2) } : null,
  ].filter(Boolean) as Stat[]

  const perfStats = [
    activity.training_effect_aerobic ? { label: 'Aerobic TE', value: activity.training_effect_aerobic.toFixed(1) } : null,
    activity.training_effect_anaerobic ? { label: 'Anaerobic TE', value: activity.training_effect_anaerobic.toFixed(1) } : null,
    activity.vo2max ? { label: 'VO2max', value: activity.vo2max.toFixed(1) } : null,
    activity.decoupling_pct != null ? { label: 'Decoupling', value: activity.decoupling_pct.toFixed(1), unit: '%' } : null,
    activity.efficiency_factor != null ? { label: 'EF', value: (activity.efficiency_factor * 1000).toFixed(2), unit: 'mm/s/bpm' } : null,
  ].filter(Boolean) as Stat[]

  const weatherStats = [
    activity.weather_adjusted_pace_min_km != null
      ? { label: 'Adj. pace', value: formatPace(activity.weather_adjusted_pace_min_km), unit: '/km' }
      : null,
    activity.weather_penalty_sec_per_km != null
      ? { label: 'Heat penalty', value: `+${Math.round(activity.weather_penalty_sec_per_km)}`, unit: 's/km' }
      : null,
  ].filter(Boolean) as Stat[]

  const extraGroups = [
    dynamicsStats.length > 0 && 'dynamics',
    powerStats.length > 0 && 'power',
    perfStats.length > 0 && 'performance',
    weatherStats.length > 0 && 'conditions',
  ].filter(Boolean) as string[]

  // Structured session: a rep chart from the per-step adherence (D1, D5);
  // the HR chart runs over distance with the work reps shaded (D4).
  const structured = repsFromAdherence(activity.adherence).length >= 2
  const distanceKm = sampleDistancesKm(activity.chart_data, activity.distance_m)
  const windows = stepWindows(activity.adherence)
  const repWindows = windows?.filter(w => w.stepType === 'interval') ?? null
  const hasChart = !!activity.chart_data && Object.keys(activity.chart_data).length > 0

  return (
    <div className="activity-detail">
      {showStickyHeader && (
        <div className="sticky-detail-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <span className="sticky-detail-name">{activity.name || 'Workout'}</span>
          <span className="sticky-detail-meta">
            {formatDistance(activity.distance_m)} km · {formatPace(activity.avg_pace_min_km)} /km
          </span>
        </div>
      )}

      {/* Header */}
      <header ref={headerRef} className="detail-header" style={{ borderBottomColor: color }}>
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="detail-header-info">
          <span className="badge badge-effort" style={{ '--effort': color } as CSSProperties}>{typeLabel}</span>
          {activity.personal_records && activity.personal_records.length > 0 && (
            <span
              className="badge pr-badge"
              title={activity.personal_records.map(r => `${r.label}: ${r.display_value}`).join(', ')}
            >
              <Trophy size={11} /> New PB
            </span>
          )}
          <h1 className="detail-title">{activity.name || 'Workout'}</h1>
          {activity.started_at && (
            <span className="detail-date">{format(parseISO(activity.started_at), 'EEEE, d MMMM yyyy, HH:mm')}</span>
          )}
        </div>
      </header>

      <div className="detail-body">
        {/* detail-columns/detail-col-* are `display: contents` below 1024px,
            so every slot renders as one flat stack whose sequence comes from
            the `order` values in ActivityDetailView.css. At >=1024px they
            become independently-tall flex columns: figures, verdict, reps
            and stats lead on the left (D6); charts follow on the right. */}
        <div className="detail-columns">
          <div className="detail-col detail-col-left">
            <div className="detail-slot slot-headline">
              <HeadlinePanel activity={activity} onReanalyze={handleReanalyze} isAnalyzing={isAnalyzing} />
            </div>

            <div className="detail-slot slot-reps">
              {structured && activity.adherence ? (
                <RepsPanel
                  adherence={activity.adherence}
                  color={color}
                  hr={activity.chart_data?.heart_rate?.data}
                  distanceKm={distanceKm}
                  windows={windows}
                />
              ) : (
                <>
                  {activity.adherence && <AdherenceCard adherence={activity.adherence} />}
                  {activity.splits && (
                    <SplitsBars splits={activity.splits} paceZones={activity.metric_zones?.pace} color={color} />
                  )}
                </>
              )}
            </div>

            {(secondaryStats.length > 0 || extraGroups.length > 0) && (
              <div className="detail-slot slot-stats">
                <section className="detail-panel more-stats">
                  <div className="detail-panel-head">
                    <h3 className="section-title">More stats</h3>
                    {extraGroups.length > 0 && (
                      <button
                        type="button"
                        className="detail-panel-link"
                        aria-expanded={showAllStats}
                        aria-label={showAllStats ? 'Hide extra stats' : `Show all stats (${extraGroups.join(', ')})`}
                        onClick={() => setShowAllStats(v => !v)}
                      >
                        {showAllStats ? 'Hide' : 'Show all'}
                      </button>
                    )}
                  </div>

                  {secondaryStats.length > 0 && <StatGrid stats={secondaryStats} columns={3} plain />}

                  {showAllStats && (
                    <>
                      {dynamicsStats.length > 0 && (
                        <div className="more-stats-group">
                          <h4 className="more-stats-title">Running dynamics</h4>
                          <StatGrid stats={dynamicsStats} columns={3} plain />
                        </div>
                      )}

                      {powerStats.length > 0 && (
                        <div className="more-stats-group">
                          <h4 className="more-stats-title">Power</h4>
                          <StatGrid stats={powerStats} columns={4} plain />
                        </div>
                      )}

                      {perfStats.length > 0 && (
                        <div className="more-stats-group">
                          <div className="more-stats-title-row">
                            <h4 className="more-stats-title">Performance</h4>
                            <StatHelpButton topic="activity-performance" label="Performance" />
                          </div>
                          <StatGrid stats={perfStats} columns={3} plain />
                        </div>
                      )}

                      {weatherStats.length > 0 && (
                        <div className="more-stats-group">
                          <h4 className="more-stats-title">Conditions</h4>
                          <StatGrid stats={weatherStats} columns={2} plain />
                          {activity.weather_description && (
                            <p className="weather-description">{activity.weather_description}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}
          </div>

          <div className="detail-col detail-col-right">
            {hasChart && (
              <div className="detail-slot slot-chart">
                <ChartTabs
                  chartData={activity.chart_data!}
                  metricZones={activity.metric_zones}
                  distanceKm={distanceKm}
                  repWindows={structured ? repWindows : null}
                />
              </div>
            )}

            <div className="detail-slot slot-zones">
              {activity.hr_zones && <HrZonesChart zones={activity.hr_zones} />}
              {activity.chart_data?.pace && (
                <PaceZonesChart paceSeries={activity.chart_data.pace} durationSec={activity.duration_sec} />
              )}
            </div>

            <div className="detail-slot slot-route">
              <RouteMap route={activity.route} activityColor={color} />
            </div>
          </div>
        </div>

        {/* Rating is the gate to the coach's analysis; once rated, the
            headline panel shows the analysis (or that it's being written). */}
        {!activity.insight && !activity.feedback_rating && (
          <div className="detail-slot slot-feedback">
            <FeedbackPrompt activityId={activity.id} />
          </div>
        )}
      </div>
    </div>
  )
}
