import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from './client'
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
} from './types'

export function useToday(date: string) {
  return useQuery({
    queryKey: ['today', date],
    queryFn: () => apiGet<TodayResponse>(`/today?date=${date}`),
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
