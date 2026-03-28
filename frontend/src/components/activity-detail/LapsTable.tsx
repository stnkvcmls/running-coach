import { formatPace, formatDuration, formatDistance } from '../../utils/formatting'
import './LapsTable.css'

interface Props {
  splits: any
}

export default function LapsTable({ splits }: Props) {
  if (!splits || !Array.isArray(splits) || splits.length === 0) return null

  return (
    <section className="detail-section">
      <h3 className="section-title">Laps</h3>
      <div className="card laps-card">
        <div className="laps-table-scroll">
          <table className="laps-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Distance</th>
                <th>Time</th>
                <th>Pace</th>
                <th>Avg HR</th>
              </tr>
            </thead>
            <tbody>
              {splits.map((lap: any, i: number) => {
                const distance = lap.distance || lap.splitDistance
                const duration = lap.duration || lap.splitDuration || lap.totalTime
                const avgHr = lap.averageHR || lap.averageHeartRate
                const pace = distance && duration ? (duration / 60) / (distance / 1000) : null

                return (
                  <tr key={i}>
                    <td className="lap-num">{i + 1}</td>
                    <td>{formatDistance(distance)} km</td>
                    <td>{formatDuration(duration)}</td>
                    <td>{formatPace(pace)}</td>
                    <td>{avgHr ? `${Math.round(avgHr)}` : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
