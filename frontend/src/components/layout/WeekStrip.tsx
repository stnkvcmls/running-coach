import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDateContext } from '../../App'
import { useCalendarWeek } from '../../api/hooks'
import { getWeekDays, format, formatDateKey, isSameDay, isToday, addWeeks, subWeeks } from '../../utils/date'
import './WeekStrip.css'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type DayMarker = 'done' | 'race' | 'planned' | null

export default function WeekStrip() {
  const { selectedDate, setSelectedDate } = useDateContext()
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])
  const dateKey = formatDateKey(weekDays[0])
  const { data: weekData } = useCalendarWeek(dateKey)

  const markerByDate = useMemo(() => {
    const m = new Map<string, DayMarker>()
    if (!weekData) return m
    for (const day of weekData) {
      if (day.activities.length > 0) {
        m.set(day.date, 'done')
      } else if (day.events.some(e => e.event_type === 'race')) {
        m.set(day.date, 'race')
      } else if (day.events.some(e => e.event_type === 'workout')) {
        m.set(day.date, 'planned')
      }
    }
    return m
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
          const marker = markerByDate.get(formatDateKey(day)) ?? null
          return (
            <button
              key={i}
              className={`week-day ${selected ? 'selected' : ''} ${today ? 'today' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <span className="day-name">{DAY_NAMES[i]}</span>
              <span className="day-number">{format(day, 'd')}</span>
              {marker && <span className={`day-dot ${marker !== 'done' ? `day-dot-${marker}` : ''}`} />}
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
