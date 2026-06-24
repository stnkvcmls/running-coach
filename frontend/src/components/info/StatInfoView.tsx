import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { STAT_INFO } from './statInfo'
import './StatInfoView.css'

export default function StatInfoView() {
  const { topic } = useParams<{ topic: string }>()
  const navigate = useNavigate()
  const info = topic ? STAT_INFO[topic] : undefined

  return (
    <div className="stat-info">
      <header className="stat-info-header">
        <button className="stat-info-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <div className="stat-info-header-info">
          <h1 className="stat-info-title">{info ? info.title : 'Not found'}</h1>
          <span className="stat-info-subtitle">How each stat is calculated</span>
        </div>
      </header>

      <div className="stat-info-body">
        {!info ? (
          <div className="stat-info-empty">No explanation available for this section.</div>
        ) : (
          <>
            {info.intro && <p className="stat-info-intro">{info.intro}</p>}
            {info.stats.map(stat => (
              <section className="stat-info-card" key={stat.name}>
                <h2 className="stat-info-card-name">
                  {stat.name}
                  {stat.acronym && <span className="stat-info-acronym">{stat.acronym}</span>}
                </h2>
                <p className="stat-info-desc">{stat.description}</p>

                <div className="stat-info-field">
                  <span className="stat-info-field-label">Formula</span>
                  <code className="stat-info-formula">{stat.formula}</code>
                </div>

                <div className="stat-info-field">
                  <span className="stat-info-field-label">Limits &amp; interpretation</span>
                  <p className="stat-info-limits">{stat.limits}</p>
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
