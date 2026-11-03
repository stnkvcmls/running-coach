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
import SettingsSectionView from './components/settings/SettingsSectionView'
import WorkoutDetailView from './components/workout-detail/WorkoutDetailView'
import OnboardingView from './components/onboarding/OnboardingView'
import TrendsView from './components/trends/TrendsView'
import PlanView from './components/plan/PlanView'
import PlanSetupView from './components/plan-setup/PlanSetupView'
import StatInfoView from './components/info/StatInfoView'
import ChatView from './components/chat/ChatView'
import { ToastHost } from './components/ui/Toast'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { useAthleteProfile } from './api/hooks'
import { useThemePreference, type ResolvedTheme, type ThemePreference } from './hooks/useThemePreference'
import './App.css'

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
  /** The painted theme ('system' already resolved) — what charts read. */
  theme: ResolvedTheme
  /** The athlete's Settings → Appearance choice. */
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  preference: 'system',
  setPreference: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export interface RouteMeta {
  path: string
  title: string
  chrome: 'main' | 'detail'
  /** Render the week strip / month calendar under the TopBar, plus its
   * toggle. Only Today reads DateContext, so only Today sets it; the TopBar
   * then titles the page with the selected date instead of `title`. */
  weekStrip?: boolean
  /** Training-context line under the TopBar title: 'block' → "Build block,
   * week 1 of 4"; 'goal' → "Berlin Marathon in 90 days". */
  subtitle?: 'block' | 'goal'
}

const DEFAULT_ROUTE_META: RouteMeta = { path: '', title: '', chrome: 'main' }

// Single source of truth for page chrome: 'main' renders TopBar + bottom nav
// (+ the calendar strip where `weekStrip` is set); 'detail' renders none of
// those (the view supplies its own header, e.g. ActivityDetailView's
// back-arrow header).
const ROUTES: RouteMeta[] = [
  { path: '/', title: 'Today', weekStrip: true, subtitle: 'block', chrome: 'main' },
  { path: '/plan', title: 'Plan', subtitle: 'goal', chrome: 'main' },
  { path: '/chat', title: 'Coach', chrome: 'main' },
  { path: '/activities', title: 'Activities', chrome: 'main' },
  { path: '/trends', title: 'Progress', chrome: 'main' },
  { path: '/daily', title: 'Daily history', chrome: 'main' },
  { path: '/activities/:id', title: 'Activity', chrome: 'detail' },
  { path: '/daily/:id', title: 'Daily summary', chrome: 'detail' },
  { path: '/workouts/:id', title: 'Workout', chrome: 'detail' },
  { path: '/info/:topic', title: 'Info', chrome: 'detail' },
  { path: '/plan/setup', title: 'Plan setup', chrome: 'detail' },
  { path: '/settings', title: 'Settings', chrome: 'detail' },
  { path: '/settings/:section', title: 'Settings', chrome: 'detail' },
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
  const { theme, preference, setPreference } = useThemePreference()
  const location = useLocation()
  const navigate = useNavigate()

  // index.html's pre-paint script applies the same resolution before React
  // loads; this keeps it current when the preference or OS setting changes.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    // The browser chrome (theme-color) follows the ground token of the theme
    // just applied, read back from CSS so the value lives only in globals.css.
    const ground = getComputedStyle(root).getPropertyValue('--bg').trim()
    if (ground) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ground)
  }, [theme])

  // First-run: redirect to onboarding when no athlete profile exists yet.
  const { data: profile, isLoading: profileLoading } = useAthleteProfile()
  useEffect(() => {
    if (!profileLoading && profile === null && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    }
  }, [profileLoading, profile, location.pathname, navigate])

  const routeMeta = useRouteMeta()
  const isDetailPage = routeMeta.chrome === 'detail'

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference }}>
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      <div className="app-shell">
        {!isDetailPage && (
          <TopBar
            calendarExpanded={calendarExpanded}
            onToggleCalendar={() => setCalendarExpanded(!calendarExpanded)}
          />
        )}
        {!isDetailPage && routeMeta.weekStrip && (
          <CalendarContainer
            expanded={calendarExpanded}
            onToggle={setCalendarExpanded}
          />
        )}
        <div className="app-body">
          <main className={`app-main ${!isDetailPage ? 'app-main--with-nav' : ''}`}>
            <ErrorBoundary key={location.pathname}>
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
                <Route path="/settings/:section" element={<SettingsSectionView />} />
                <Route path="/info/:topic" element={<StatInfoView />} />
                <Route path="/onboarding" element={<OnboardingView />} />
                <Route path="/chat" element={<ChatView />} />
              </Routes>
            </ErrorBoundary>
          </main>
          {!isDetailPage && <BottomNav />}
        </div>
        <ToastHost />
      </div>
    </DateContext.Provider>
    </ThemeContext.Provider>
  )
}
