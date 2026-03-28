import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDateContext } from '../../App'
import { useCalendarWeek } from '../../api/hooks'
import { getWeekDays, format, formatDateKey, isSameDay, isToday, addWeeks, subWeeks } from '../../utils/date'
import './WeekStrip.css'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeekStrip() {
  const { selectedDate, setSelectedDate } = useDateContext()
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])
  const dateKey = formatDateKey(weekDays[0])
  const { data: weekData } = useCalendarWeek(dateKey)

  const activityDates = useMemo(() => {
    if (!weekData) return new Set<string>()
    return new Set(
      weekData
        .filter(d => d.activities.length > 0)
        .map(d => d.date)
    )
  }, [weekData])

  const goBack = () => setSelectedDate(subWeeks(selectedDate, 1))
  const goForward = () => setSelectedDate(addWeeks(selectedDate, 1))

  return (
    <div className="week-strip">
      <button className="week-nav-btn" onClick={goBack} aria-label="Previous week">
        <ChevronLeft size={18} />
      </button>
      <div className="week-days">
        {weekDays.map((day, i) => {
          const selected = isSameDay(day, selectedDate)
          const today = isToday(day)
          const hasActivity = activityDates.has(formatDateKey(day))
          return (
            <button
              key={i}
              className={`week-day ${selected ? 'selected' : ''} ${today ? 'today' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <span className="day-name">{DAY_NAMES[i]}</span>
              <span className="day-number">{format(day, 'd')}</span>
              {hasActivity && <span className="day-dot" />}
            </button>
          )
        })}
      </div>
      <button className="week-nav-btn" onClick={goForward} aria-label="Next week">
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
