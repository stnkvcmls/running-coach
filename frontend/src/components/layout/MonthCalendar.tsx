import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDateContext } from '../../App'
import { useCalendarMonth } from '../../api/hooks'
import { getMonthDays, format, formatDateKey, formatMonthKey, isSameDay, isToday, addMonths, subMonths, startOfMonth } from '../../utils/date'
import { getColorHex } from '../../utils/colors'
import './MonthCalendar.css'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MonthCalendar() {
  const { selectedDate, setSelectedDate } = useDateContext()
  const monthStart = startOfMonth(selectedDate)
  const monthKey = formatMonthKey(monthStart)
  const { data: monthData } = useCalendarMonth(monthKey)

  const days = useMemo(() => getMonthDays(monthStart), [monthStart])

  const activityMap = useMemo(() => {
    if (!monthData) return new Map<string, typeof monthData>()
    const m = new Map<string, (typeof monthData)[0]>()
    for (const d of monthData) {
      m.set(d.date, d)
    }
    return m
  }, [monthData])

  const goPrev = () => setSelectedDate(subMonths(selectedDate, 1))
  const goNext = () => setSelectedDate(addMonths(selectedDate, 1))

  return (
    <div className="month-calendar">
      <div className="month-header">
        <button className="month-nav-btn" onClick={goPrev} aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <span className="month-title">{format(monthStart, 'MMMM yyyy')}</span>
        <button className="month-nav-btn" onClick={goNext} aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="month-grid">
        {DAY_HEADERS.map(d => (
          <div key={d} className="month-day-header">{d}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="month-day empty" />
          const key = formatDateKey(day)
          const dayData = activityMap.get(key)
          const selected = isSameDay(day, selectedDate)
          const today = isToday(day)
          const activities = dayData?.activities || []

          return (
            <button
              key={key}
              className={`month-day ${selected ? 'selected' : ''} ${today ? 'today' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <span className="month-day-num">{format(day, 'd')}</span>
              {activities.length > 0 && (
                <div className="month-day-dots">
                  {activities.slice(0, 3).map((a, j) => (
                    <span
                      key={j}
                      className="month-dot"
                      style={{ background: getColorHex(a.name, a.activity_type) }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
