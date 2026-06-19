import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut } from './client'
import type {
  TodayResponse,
  ActivitySummary,
  ActivityDetail,
  DailySummaryResponse,
  DailySummaryDetail,
  CalendarDay,
  CalendarEvent,
  FeedbackRequest,
  InsightResponse,
  SettingsResponse,
  AiConfigResponse,
  AiConfigRequest,
  AthleteProfile,
  AthleteProfileRequest,
  TrainingLoadResponse,
  TrainingPlanResponse,
  ZoneConfigBulkUpdate,
  ZoneConfigsResponse,
  ThresholdEstimateResponse,
  ThresholdApplyRequest,
} from './types'

export function useToday(date: string) {
  return useQuery({
    queryKey: ['today', date],
    queryFn: () => apiGet<TodayResponse>(`/today?date=${date}`),
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

export function useActivities(page: number, type?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '30' })
  if (type) params.set('type', type)
  return useQuery({
    queryKey: ['activities', page, type],
    queryFn: () => apiGet<ActivitySummary[]>(`/activities?${params}`),
  })
}

export function useActivity(id: number) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => apiGet<ActivityDetail>(`/activities/${id}`),
    enabled: id > 0,
  })
}

export function useDailySummaries(page: number) {
  return useQuery({
    queryKey: ['daily-summaries', page],
    queryFn: () => apiGet<DailySummaryResponse[]>(`/daily-summaries?page=${page}&limit=30`),
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

export function useTriggerAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiPost<{ status: string }>(`/activities/${id}/analyze`),
    onSuccess: (_, id) => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ['activity', id] }), 5000)
    },
  })
}

export function useSubmitFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, feedback }: { id: number; feedback: FeedbackRequest }) =>
      apiPost<{ status: string }>(`/activities/${id}/feedback`, feedback),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['activity', id] })
      setTimeout(() => qc.invalidateQueries({ queryKey: ['activity', id] }), 5000)
      setTimeout(() => qc.invalidateQueries({ queryKey: ['activity', id] }), 12000)
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost<TrainingPlanResponse>('/training-plan/generate', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training-plan'] })
    },
  })
}
