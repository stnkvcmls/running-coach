import { useState } from 'react'
import { useSetRpe } from '../../api/hooks'
import type { ActivityDetail } from '../../api/types'
import './EffortPrompt.css'

/** Inline RPE (§8 Q2): lightweight PATCH that records effort without wiping
 * analysis or fabricating a feedback rating. Hidden once rated. */
export default function EffortPrompt({ detail }: { detail: ActivityDetail }) {
  const setRpe = useSetRpe()
  const [picked, setPicked] = useState<number | null>(null)
  const rated = detail.rpe ?? (setRpe.isSuccess ? picked : null)

  if (rated != null) return <p className="session-felt">Felt <span className="num">{rated}</span>/10</p>

  return (
    <div className="session-rpe">
      <p className="session-rpe-q" id="session-rpe-q">How hard did it feel?</p>
      <div className="seg-control seg-control--10" role="group" aria-labelledby="session-rpe-q">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
          <button
            key={v}
            type="button"
            aria-pressed={picked === v}
            aria-label={`${v} of 10`}
            disabled={setRpe.isPending}
            onClick={() => {
              setPicked(v)
              setRpe.mutate({ id: detail.id, rpe: v })
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="seg-control-ends"><span>Easy</span><span>All out</span></div>
    </div>
  )
}
