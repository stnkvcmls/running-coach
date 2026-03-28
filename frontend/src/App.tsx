import { useState, createContext, useContext } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import TopBar from './components/layout/TopBar'
import BottomNav from './components/layout/BottomNav'
import CalendarContainer from './components/layout/CalendarContainer'
import TodayView from './components/today/TodayView'
import ActivitiesView from './components/activities/ActivitiesView'
import ActivityDetailView from './components/activity-detail/ActivityDetailView'
import DailySummariesView from './components/daily/DailySummariesView'
import DailyDetailView from './components/daily/DailyDetailView'
import SettingsView from './components/settings/SettingsView'

interface DateContextType {
  selectedDate: Date
  setSelectedDate: (d: Date) => void
}

export const DateContext = createContext<DateContextType>({
  selectedDate: new Date(),
  setSelectedDate: () => {},
})

export function useDateContext() {
  return useContext(DateContext)
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarExpanded, setCalendarExpanded] = useState(false)
  const location = useLocation()

  const isDetailPage = location.pathname.startsWith('/activities/') || location.pathname.startsWith('/daily/')
  const showCalendar = !isDetailPage

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        {showCalendar && (
          <>
            <TopBar
              calendarExpanded={calendarExpanded}
              onToggleCalendar={() => setCalendarExpanded(!calendarExpanded)}
            />
            <CalendarContainer
              expanded={calendarExpanded}
              onToggle={setCalendarExpanded}
            />
          </>
        )}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: isDetailPage ? '0' : 'calc(var(--nav-height) + env(safe-area-inset-bottom, 0px))',
          WebkitOverflowScrolling: 'touch',
        }}>
          <Routes>
            <Route path="/" element={<TodayView />} />
            <Route path="/activities" element={<ActivitiesView />} />
            <Route path="/activities/:id" element={<ActivityDetailView />} />
            <Route path="/daily" element={<DailySummariesView />} />
            <Route path="/daily/:id" element={<DailyDetailView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
        {!isDetailPage && <BottomNav />}
      </div>
    </DateContext.Provider>
  )
}
