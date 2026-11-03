import { Download } from 'lucide-react'

const EXPORT_LINKS = [
  { label: 'Activities CSV', url: '/api/v1/export/activities?format=csv', filename: 'activities.csv' },
  { label: 'Activities JSON', url: '/api/v1/export/activities?format=json', filename: 'activities.json' },
  { label: 'Insights CSV', url: '/api/v1/export/insights?format=csv', filename: 'insights.csv' },
  { label: 'Insights JSON', url: '/api/v1/export/insights?format=json', filename: 'insights.json' },
]

export default function DataExportSection() {
  return (
    <section className="settings-section">
      <h2 className="section-title">Data export</h2>
      <div className="export-buttons">
        {EXPORT_LINKS.map(({ label, url, filename }) => (
          <a key={url} href={url} download={filename} className="sync-btn export-btn">
            <Download size={16} />
            {label}
          </a>
        ))}
      </div>
    </section>
  )
}
