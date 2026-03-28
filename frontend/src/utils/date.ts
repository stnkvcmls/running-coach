import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, eachDayOfInterval, getDay, isSameDay, isToday as fnsIsToday, parseISO } from 'date-fns'

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
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - startOfYear.getTime()
  return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7)
}

export function getTotalWeeksInYear(year: number): number {
  const dec31 = new Date(year, 11, 31)
  return getWeekNumber(dec31)
}
