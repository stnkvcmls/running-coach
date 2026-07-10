import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, useLocation, useNavigate, matchPath } from 'react-router-dom'
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
import StatInfoView from './components/info/StatInfoView'
import ChatView from './components/chat/ChatView'
import { ToastHost } from './components/ui/Toast'
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

export interface RouteMeta {
  path: string
  title: string
  /** Show the "Week N/52" suffix next to the title (Today + Plan only). */
  weekLabel?: boolean
  chrome: 'main' | 'detail'
}

const DEFAULT_ROUTE_META: RouteMeta = { path: '', title: '', chrome: 'main' }

// Single source of truth for page chrome: 'main' renders TopBar + calendar
// strip + bottom nav; 'detail' renders none of those (the view supplies its
// own header, e.g. ActivityDetailView's back-arrow header).
const ROUTES: RouteMeta[] = [
  { path: '/', title: 'Today', weekLabel: true, chrome: 'main' },
  { path: '/plan', title: 'Plan', weekLabel: true, chrome: 'main' },
  { path: '/chat', title: 'Coach', chrome: 'main' },
  { path: '/activities', title: 'Activities', chrome: 'main' },
  { path: '/trends', title: 'Progress', chrome: 'main' },
  { path: '/daily', title: 'Daily History', chrome: 'main' },
  { path: '/activities/:id', title: 'Activity', chrome: 'detail' },
  { path: '/daily/:id', title: 'Daily Summary', chrome: 'detail' },
  { path: '/workouts/:id', title: 'Workout', chrome: 'detail' },
  { path: '/info/:topic', title: 'Info', chrome: 'detail' },
  { path: '/plan/setup', title: 'Plan Setup', chrome: 'detail' },
  { path: '/settings', title: 'Settings', chrome: 'detail' },
  { path: '/onboarding', title: 'Onboarding', chrome: 'detail' },
]

export function useRouteMeta(): RouteMeta {
  const location = useLocation()
  return (
    ROUTES.find(route => matchPath({ path: route.path, end: true }, location.pathname)) ??
    DEFAULT_ROUTE_META
  )
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

  const routeMeta = useRouteMeta()
  const isDetailPage = routeMeta.chrome === 'detail'
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
            <Route path="/info/:topic" element={<StatInfoView />} />
            <Route path="/onboarding" element={<OnboardingView />} />
            <Route path="/chat" element={<ChatView />} />
          </Routes>
        </main>
        {!isDetailPage && <BottomNav />}
        <ToastHost />
      </div>
    </DateContext.Provider>
    </ThemeContext.Provider>
  )
}
