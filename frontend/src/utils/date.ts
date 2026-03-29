import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, eachDayOfInterval, getDay, isSameDay, isToday as fnsIsToday, parseISO, getISOWeek, getISOWeeksInYear } from 'date-fns'

export { format, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, isSameDay, parseISO }

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday start
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function getMonthDays(date: Date): (Date | null)[] {
  const start = startOfMonth(date)
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

  // Day of week for first day (0=Sun, adjust for Monday start)
  let firstDow = getDay(start) - 1
  if (firstDow < 0) firstDow = 6

  const result: (Date | null)[] = []
  for (let i = 0; i < firstDow; i++) result.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    result.push(new Date(date.getFullYear(), date.getMonth(), d))
  }
  return result
}

export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatMonthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}

export function isToday(date: Date): boolean {
  return fnsIsToday(date)
}

export function getWeekNumber(date: Date): number {
  return getISOWeek(date)
}

export function getTotalWeeksInYear(year: number): number {
  return getISOWeeksInYear(new Date(year, 6, 1))
}
