import { Footprints, Bike, Waves, PersonStanding, Dumbbell, Activity } from 'lucide-react'
import type { ComponentType } from 'react'

export type SportIconComponent = ComponentType<{ size?: number; className?: string }>

/** Maps a raw Garmin `activity_type` (e.g. "trail_running", "road_biking") to the
 *  lucide icon representing its sport. Mirrors the substring rules the backend
 *  uses to bucket activity types (see `_categorize_activity_type` in app/routers/daily.py),
 *  plus a strength bucket the backend doesn't need to split out. */
export function getSportIcon(activityType: string | null | undefined): SportIconComponent {
  const t = (activityType || '').toLowerCase()
  if (t.includes('run')) return Footprints
  if (t.includes('cycling') || t.includes('biking') || t.includes('bik')) return Bike
  if (t.includes('swim')) return Waves
  if (t.includes('walk') || t.includes('hik')) return PersonStanding
  if (t.includes('strength') || t.includes('weight')) return Dumbbell
  return Activity
}
