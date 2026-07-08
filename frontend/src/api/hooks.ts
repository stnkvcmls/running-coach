import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  AIJobEnqueuedResponse,
  AIJobResponse,
  TodayResponse,
  ActivitySummary,
  ActivityDetail,
  DailySummaryResponse,
  DailySummaryDetail,
  CalendarDay,
  CalendarEvent,
  DailyCheckin,
  DailyCheckinRequest,
  FeedbackRequest,
  GarminConnectResult,
  GarminConnectionStatus,
  GarminCredentialsRequest,
  InsightResponse,
  IntensityTrendsResponse,
  PacingStrategyResponse,
  PacingPushRequest,
  PerformanceCurveResponse,
  PerformanceCurveCompareMode,
  PersonalRecordsResponse,
  PlanRealignmentStatus,
  PushWorkoutResponse,
  SettingsResponse,
  AiConfigResponse,
  AiConfigRequest,
  AthleteProfile,
  AthleteProfileRequest,
  CoachMemory,
  CoachMemoryRequest,
  CoachMemoryUpdateRequest,
  TrainingLoadResponse,
  TrainingPlanDay,
  TrainingPlanResponse,
  SeasonPlanResponse,
  UserResponse,
  ZoneConfigBulkUpdate,
  ZoneConfigsResponse,
  ThresholdEstimateResponse,
  ThresholdApplyRequest,
  AerobicTrendsResponse,
  CustomChartMetricsResponse,
  CustomChartDataResponse,
  VapidPublicKeyResponse,
  PushSubscriptionRequest,
  NotificationPreferencesResponse,
  NotificationPreferencesRequest,
} from './types'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiGet<UserResponse>('/me'),
  })
}

export function useToday(date: string) {
  return useQuery({
    queryKey: ['today', date],
    queryFn: () => apiGet<TodayResponse>(`/today?date=${date}`),
  })
}

export function useSubmitDailyCheckin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ date, checkin }: { date: string; checkin: DailyCheckinRequest }) =>
      apiPost<DailyCheckin>(`/daily-checkin?date=${date}`, checkin),
    onSuccess: (_, { date }) => {
      qc.invalidateQueries({ queryKey: ['today', date] })
    },
  })
}

export function useTrainingLoad(days = 90) {
  return useQuery({
    queryKey: ['training-load', days],
    queryFn: () => apiGet<TrainingLoadResponse>(`/training-load?days=${days}`),
  })
}

export function useWellnessTrends(days = 90) {
  return useQuery({
    queryKey: ['wellness-trends', days],
    queryFn: () => apiGet<DailySummaryResponse[]>(`/wellness-trends?days=${days}`),
  })
}

export const ACTIVITIES_PAGE_SIZE = 30

export function useActivities(type?: string) {
  return useInfiniteQuery({
    queryKey: ['activities', type],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: String(ACTIVITIES_PAGE_SIZE) })
      if (type) params.set('type', type)
      return apiGet<ActivitySummary[]>(`/activities?${params}`)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === ACTIVITIES_PAGE_SIZE ? (lastPageParam as number) + 1 : undefined,
  })
}

export function useActivity(id: number) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => apiGet<ActivityDetail>(`/activities/${id}`),
    enabled: id > 0,
  })
}

export const DAILY_SUMMARIES_PAGE_SIZE = 30

export function useDailySummaries() {
  return useInfiniteQuery({
    queryKey: ['daily-summaries'],
    queryFn: ({ pageParam }) =>
      apiGet<DailySummaryResponse[]>(`/daily-summaries?page=${pageParam}&limit=${DAILY_SUMMARIES_PAGE_SIZE}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === DAILY_SUMMARIES_PAGE_SIZE ? (lastPageParam as number) + 1 : undefined,
  })
}

export function useDailySummary(id: number) {
  return useQuery({
    queryKey: ['daily-summary', id],
    queryFn: () => apiGet<DailySummaryDetail>(`/daily-summaries/${id}`),
    enabled: id > 0,
  })
}

export function useCalendarMonth(month: string) {
  return useQuery({
    queryKey: ['calendar-month', month],
    queryFn: () => apiGet<CalendarDay[]>(`/calendar?month=${month}`),
  })
}

export function useCalendarWeek(date: string) {
  return useQuery({
    queryKey: ['calendar-week', date],
    queryFn: () => apiGet<CalendarDay[]>(`/calendar/week?date=${date}`),
  })
}

export function useCalendarEvent(id: number) {
  return useQuery({
    queryKey: ['calendar-event', id],
    queryFn: () => apiGet<CalendarEvent>(`/calendar-events/${id}`),
    enabled: id > 0,
  })
}

export function useInsights(category?: string) {
  const params = new URLSearchParams({ limit: '50' })
  if (category) params.set('category', category)
  return useQuery({
    queryKey: ['insights', category],
    queryFn: () => apiGet<InsightResponse[]>(`/insights?${params}`),
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiGet<SettingsResponse>('/settings'),
  })
}

export function useTriggerSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (type: string) => apiPost<{ status: string }>(`/sync/${type}`),
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries(), 3000)
    },
  })
}

export function useJobStatus(jobId: number | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => apiGet<AIJobResponse>(`/jobs/${jobId}`),
    enabled: jobId != null && jobId > 0,
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'pending' || s === 'running' ? 2000 : false
    },
  })
}

export function useTriggerAnalysis() {
  return useMutation({
    mutationFn: (id: number) => apiPost<AIJobEnqueuedResponse>(`/activities/${id}/analyze`),
  })
}

export function useSubmitFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, feedback }: { id: number; feedback: FeedbackRequest }) =>
      apiPost<AIJobEnqueuedResponse>(`/activities/${id}/feedback`, feedback),
    onSuccess: (_, { id }) => {
      // Immediately refresh so the card shows the pending state; job polling
      // in ActivityDetailView handles subsequent refreshes on completion.
      qc.invalidateQueries({ queryKey: ['activity', id] })
    },
  })
}

export function useAiConfig() {
  return useQuery({
    queryKey: ['ai-config'],
    queryFn: () => apiGet<AiConfigResponse>('/ai-config'),
  })
}

export function useSetAiConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (config: AiConfigRequest) =>
      apiPost<AiConfigResponse>('/ai-config', config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-config'] })
    },
  })
}

export function useGarminStatus() {
  return useQuery({
    queryKey: ['garmin-status'],
    queryFn: () => apiGet<GarminConnectionStatus>('/garmin-credentials/status'),
  })
}

export function useConnectGarmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (creds: GarminCredentialsRequest) =>
      apiPost<GarminConnectResult>('/garmin-credentials', creds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garmin-status'] })
    },
  })
}

export function useSubmitGarminMfa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) =>
      apiPost<GarminConnectResult>('/garmin-credentials/mfa', { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garmin-status'] })
    },
  })
}

export function useDisconnectGarmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiDelete<GarminConnectionStatus>('/garmin-credentials'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garmin-status'] })
    },
  })
}

export function useAthleteProfile() {
  return useQuery({
    queryKey: ['athlete-profile'],
    queryFn: () => apiGet<AthleteProfile | null>('/athlete-profile'),
  })
}

export function useUpdateAthleteProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (profile: AthleteProfileRequest) =>
      apiPost<AthleteProfile>('/athlete-profile', profile),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athlete-profile'] })
      qc.invalidateQueries({ queryKey: ['zone-configs'] })
    },
  })
}

export function useCoachMemories() {
  return useQuery({
    queryKey: ['coach-memory'],
    queryFn: () => apiGet<CoachMemory[]>('/coach-memory'),
  })
}

export function useCreateCoachMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memory: CoachMemoryRequest) =>
      apiPost<CoachMemory>('/coach-memory', memory),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-memory'] })
    },
  })
}

export function useUpdateCoachMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, memory }: { id: number; memory: CoachMemoryUpdateRequest }) =>
      apiPut<CoachMemory>(`/coach-memory/${id}`, memory),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-memory'] })
    },
  })
}

export function useDeleteCoachMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete<{ deleted: boolean }>(`/coach-memory/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-memory'] })
    },
  })
}

export function useVapidPublicKey() {
  return useQuery({
    queryKey: ['vapid-public-key'],
    queryFn: () => apiGet<VapidPublicKeyResponse>('/push/vapid-public-key'),
  })
}

export function useCreatePushSubscription() {
  return useMutation({
    mutationFn: (sub: PushSubscriptionRequest) =>
      apiPost<{ status: string }>('/push-subscriptions', sub),
  })
}

export function useDeletePushSubscription() {
  return useMutation({
    mutationFn: (endpoint: string) =>
      apiDelete<{ status: string }>('/push-subscriptions', { endpoint }),
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => apiGet<NotificationPreferencesResponse>('/notification-preferences'),
  })
}

export function useSetNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: NotificationPreferencesRequest) =>
      apiPut<NotificationPreferencesResponse>('/notification-preferences', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
  })
}

export function useZoneConfigs() {
  return useQuery({
    queryKey: ['zone-configs'],
    queryFn: () => apiGet<ZoneConfigsResponse>('/zones'),
  })
}

export function useThresholdEstimate() {
  return useQuery({
    queryKey: ['threshold-estimate'],
    queryFn: () => apiGet<ThresholdEstimateResponse>('/threshold-estimate'),
  })
}

export function useApplyThresholdEstimate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: ThresholdApplyRequest) =>
      apiPost<AthleteProfile>('/threshold-estimate/apply', req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athlete-profile'] })
      qc.invalidateQueries({ queryKey: ['zone-configs'] })
      qc.invalidateQueries({ queryKey: ['threshold-estimate'] })
    },
  })
}

export function useUpdateZoneConfigs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (update: ZoneConfigBulkUpdate) =>
      apiPut<ZoneConfigsResponse>('/zones', update),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zone-configs'] })
    },
  })
}

export function useTrainingPlan() {
  return useQuery({
    queryKey: ['training-plan'],
    queryFn: () => apiGet<TrainingPlanResponse | null>('/training-plan'),
  })
}

export function useGenerateTrainingPlan() {
  return useMutation({
    mutationFn: () => apiPost<AIJobEnqueuedResponse>('/training-plan/generate', {}),
  })
}

export function useGenerateBriefing() {
  return useMutation({
    mutationFn: (planDayId: number) =>
      apiPost<AIJobEnqueuedResponse>(`/training-plan/days/${planDayId}/briefing`, {}),
  })
}

export function useSeasonPlan() {
  return useQuery({
    queryKey: ['season-plan'],
    queryFn: () => apiGet<SeasonPlanResponse | null>('/season-plan'),
  })
}

export interface PerformanceCurveCompareParams {
  mode: PerformanceCurveCompareMode
  customStart?: string   // YYYY-MM-DD, required when mode === 'custom'
  customEnd?: string     // YYYY-MM-DD, required when mode === 'custom'
}

export function usePerformanceCurve(days = 90, compare?: PerformanceCurveCompareParams) {
  return useQuery({
    queryKey: ['performance-curve', days, compare],
    queryFn: () => {
      const params = new URLSearchParams({ days: String(days) })
      if (compare) {
        params.set('compare', compare.mode)
        if (compare.mode === 'custom') {
          if (compare.customStart) params.set('compareStart', compare.customStart)
          if (compare.customEnd) params.set('compareEnd', compare.customEnd)
        }
      }
      return apiGet<PerformanceCurveResponse>(`/performance-curve?${params.toString()}`)
    },
    enabled: !compare || compare.mode !== 'custom' || !!(compare.customStart && compare.customEnd),
  })
}

export function usePersonalRecords(days = 90) {
  return useQuery({
    queryKey: ['personal-records', days],
    queryFn: () => apiGet<PersonalRecordsResponse>(`/personal-records?days=${days}`),
  })
}

export function useAerobicTrends(days = 90) {
  return useQuery({
    queryKey: ['aerobic-trends', days],
    queryFn: () => apiGet<AerobicTrendsResponse>(`/aerobic-trends?days=${days}`),
  })
}

export function useCustomChartMetrics() {
  return useQuery({
    queryKey: ['custom-chart-metrics'],
    queryFn: () => apiGet<CustomChartMetricsResponse>('/custom-charts/metrics'),
    staleTime: Infinity,
  })
}

export function useCustomChartData(metricIds: string[], days: number, compare = false) {
  return useQuery({
    queryKey: ['custom-chart-data', metricIds, days, compare],
    queryFn: () => apiGet<CustomChartDataResponse>(
      `/custom-charts/data?metrics=${metricIds.join(',')}&days=${days}&compare=${compare}`
    ),
    enabled: metricIds.length > 0,
  })
}

export function useRealignmentStatus() {
  return useQuery({
    queryKey: ['realignment-status'],
    queryFn: () => apiGet<PlanRealignmentStatus>('/training-plan/realignment-status'),
  })
}

export function useIntensityTrends(days = 90, zoneType = 'hr') {
  return useQuery({
    queryKey: ['intensity-trends', days, zoneType],
    queryFn: () => apiGet<IntensityTrendsResponse>(`/intensity-trends?days=${days}&zone_type=${zoneType}`),
  })
}

export function useRealignPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (action: 'regenerate' | 'dismiss') =>
      apiPost<AIJobEnqueuedResponse | { status: string; until: string }>('/training-plan/realign', { action }),
    onSuccess: (_data, action) => {
      if (action === 'dismiss') {
        qc.invalidateQueries({ queryKey: ['realignment-status'] })
      }
      // For 'regenerate', the caller polls via useJobStatus and invalidates on done
    },
  })
}

export function useAdaptPlanDay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planDayId, action }: { planDayId: number; action: 'accept' | 'dismiss' }) =>
      apiPost<TrainingPlanDay | { status: string }>('/training-plan/adapt-day', {
        plan_day_id: planDayId,
        action,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today'] })
      qc.invalidateQueries({ queryKey: ['training-plan'] })
    },
  })
}

export function usePushWorkoutToGarmin() {
  return useMutation({
    mutationFn: (dayId: number) =>
      apiPost<PushWorkoutResponse>(`/training-plan/days/${dayId}/push-to-garmin`, {}),
  })
}

export function useRacePacing(
  raceId: number,
  params: {
    strategy?: string
    splitUnit?: string
    targetTimeSec?: number | null
    expectedTempC?: number | null
    expectedDewPointC?: number | null
  } = {},
) {
  const { strategy = 'even', splitUnit = 'km', targetTimeSec, expectedTempC, expectedDewPointC } = params
  const qs = new URLSearchParams({ strategy, split_unit: splitUnit })
  if (targetTimeSec != null) qs.set('target_time_sec', String(targetTimeSec))
  if (expectedTempC != null) qs.set('expected_temp_c', String(expectedTempC))
  if (expectedDewPointC != null) qs.set('expected_dew_point_c', String(expectedDewPointC))
  return useQuery({
    queryKey: [
      'race-pacing',
      raceId,
      strategy,
      splitUnit,
      targetTimeSec ?? null,
      expectedTempC ?? null,
      expectedDewPointC ?? null,
    ],
    queryFn: () => apiGet<PacingStrategyResponse>(`/races/${raceId}/pacing?${qs}`),
    enabled: raceId > 0,
  })
}

export function usePushRacePacing() {
  return useMutation({
    mutationFn: ({ raceId, body }: { raceId: number; body: PacingPushRequest }) =>
      apiPost<PushWorkoutResponse>(`/races/${raceId}/pacing/push`, body),
  })
}
