import { useState } from 'react'
import { useSeasonPlan } from '../../api/hooks'
import type { RaceInfo } from '../../api/types'
import { daysBetweenKeys } from '../../utils/date'
import { formatDuration } from '../../utils/formatting'
import RacePacingCard from './RacePacingCard'
import './RacesPanel.css'

const RACE_CAP = 2

interface Row {
  key: string
  race: RaceInfo | null
  title: string
  days: number
  goalOfSeason: boolean
}

function daysWord(days: number): string {
  return days === 1 ? 'day' : 'days'
}

function RaceRow({ row }: { row: Row }) {
  const [expanded, setExpanded] = useState(false)
  const sub = [
    row.race?.goal_time_sec != null ? `Goal ${formatDuration(row.race.goal_time_sec)}` : null,
    row.goalOfSeason ? 'Goal race of the season' : null,
  ].filter(Boolean).join(' · ')
  const pacing = row.race != null && row.race.id > 0

  const head = (
    <>
      <span className="race-row-title">{row.title}</span>
      <span className="race-row-days"><span className="num">{row.days}</span> {daysWord(row.days)}</span>
      {sub && <span className="race-row-sub">{sub}</span>}
    </>
  )

  return (
    <li className="race-row">
      {pacing ? (
        <button type="button" className="race-row-head" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
          {head}
        </button>
      ) : (
        <div className="race-row-head">{head}</div>
      )}
      {expanded && row.race && <RacePacingCard race={row.race} />}
    </li>
  )
}

interface Props {
  races: RaceInfo[]
  dateKey: string
}

/** Upcoming races with days to go, always including the season's goal race
 * (which the Plan screen leads with) even when it's further out. */
export default function RacesPanel({ races, dateKey }: Props) {
  const [showAll, setShowAll] = useState(false)
  const { data: season } = useSeasonPlan()
  const goalDate = season && typeof season.goal_race_date === 'string' && season.goal_race_date >= dateKey
    ? season.goal_race_date
    : null

  const rows: Row[] = [...races]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({
      key: `race-${r.id}`,
      race: r,
      title: r.title || r.distance_label || 'Race',
      days: r.days_away,
      goalOfSeason: r.date === goalDate,
    }))
  if (goalDate && !rows.some(r => r.goalOfSeason)) {
    rows.push({
      key: 'season-goal',
      race: null,
      title: season?.goal_race_title || 'Goal race',
      days: daysBetweenKeys(dateKey, goalDate),
      goalOfSeason: true,
    })
  }
  if (rows.length === 0) return null

  const capped = rows.slice(0, RACE_CAP)
  const goalRow = rows.find(r => r.goalOfSeason)
  if (goalRow && !capped.includes(goalRow)) capped.push(goalRow)
  const shown = showAll ? rows : capped
  const hidden = rows.length - capped.length

  return (
    <section className="card today-panel races-panel" aria-labelledby="races-panel-title">
      <div className="panel-head">
        <h2 id="races-panel-title" className="section-title">Races</h2>
        {!showAll && hidden > 0 && (
          <button type="button" className="text-link panel-head-link" onClick={() => setShowAll(true)}>
            Show all {rows.length} races
          </button>
        )}
      </div>
      <ul className="panel-rows">
        {shown.map(r => <RaceRow key={r.key} row={r} />)}
      </ul>
    </section>
  )
}
