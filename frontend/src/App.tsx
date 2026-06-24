import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import TopBar from './components/layout/TopBar'
import BottomNav from './components/layout/BottomNav'
import CalendarContainer from './components/layout/CalendarContainer'
import TodayView from './components/today/TodayView'
import ActivitiesView from './components/activities/ActivitiesView'
import ActivityDetailView from './components/activity-detail/ActivityDetailView'
import DailySummariesView from './components/daily/DailySummariesView'
import DailyDetailView from './components/daily/DailyDetailView'
import SettingsView from './components/settings/SettingsView'
import WorkoutDetailView from './components/workout-detail/WorkoutDetailView'
import OnboardingView from './components/onboarding/OnboardingView'
import TrendsView from './components/trends/TrendsView'
import PlanView from './components/plan/PlanView'
import PlanSetupView from './components/plan-setup/PlanSetupView'
import { useAthleteProfile } from './api/hooks'

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

interface ThemeContextType {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarExpanded, setCalendarExpanded] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  })
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // First-run: redirect to onboarding when no athlete profile exists yet.
  const { data: profile, isLoading: profileLoading } = useAthleteProfile()
  useEffect(() => {
    if (!profileLoading && profile === null && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    }
  }, [profileLoading, profile, location.pathname, navigate])

  const isOnboarding = location.pathname === '/onboarding'
  const isDetailPage = isOnboarding || location.pathname === '/plan/setup' || location.pathname.startsWith('/activities/') || location.pathname.startsWith('/daily/') || location.pathname.startsWith('/workouts/')
  const showCalendar = !isDetailPage

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
            <Route path="/workouts/:id" element={<WorkoutDetailView />} />
            <Route path="/trends" element={<TrendsView />} />
            <Route path="/plan" element={<PlanView />} />
            <Route path="/plan/setup" element={<PlanSetupView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/onboarding" element={<OnboardingView />} />
          </Routes>
        </main>
        {!isDetailPage && <BottomNav />}
      </div>
    </DateContext.Provider>
    </ThemeContext.Provider>
  )
}
