import { NavLink } from 'react-router-dom'
import { CalendarDays, Activity, ClipboardList, TrendingUp, Settings } from 'lucide-react'
import './BottomNav.css'

const tabs = [
  { to: '/', icon: CalendarDays, label: 'Today', end: true },
  { to: '/activities', icon: Activity, label: 'Activities' },
  { to: '/plan', icon: ClipboardList, label: 'Plan' },
  { to: '/trends', icon: TrendingUp, label: 'Wellness' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={20} />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
