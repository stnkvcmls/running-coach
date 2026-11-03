import { useToday } from '../../api/hooks'
import { formatDateKey } from '../../utils/date'
import WeekOverview from '../today/WeekOverview'

/** Eight weeks of volume by sport, moved here from Today (T5). The weekly
 * totals only come with the /today payload, which Today has usually cached. */
export default function WeeklyVolumeView() {
  const { data, isLoading } = useToday(formatDateKey(new Date()))
  const weeks = Array.isArray(data?.weekly_data) ? data.weekly_data : []

  if (isLoading) return <div className="spinner" aria-label="Loading weekly volume" />
  if (weeks.length === 0) return <p className="empty-state">No weekly volume yet.</p>
  return <WeekOverview data={weeks} />
}
