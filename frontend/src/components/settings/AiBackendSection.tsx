import { useAiConfig, useSetAiConfig } from '../../api/hooks'

const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
}

export default function AiBackendSection() {
  const { data, isLoading } = useAiConfig()
  const setConfig = useSetAiConfig()

  if (isLoading || !data) return null

  const handleProviderChange = (provider: string) => {
    const firstModel = data.available_models[provider]?.[0] ?? ''
    setConfig.mutate({ provider, model: firstModel })
  }

  const handleModelChange = (model: string) => {
    setConfig.mutate({ provider: data.provider, model })
  }

  const isPending = setConfig.isPending

  return (
    <section className="settings-section">
      <h2 className="section-title">AI Backend</h2>
      <div className="card ai-config">
        <label className="ai-config-label">
          Provider
          <select
            value={data.provider}
            disabled={isPending}
            onChange={e => handleProviderChange(e.target.value)}
          >
            {data.available_providers.map(p => (
              <option key={p} value={p}>{PROVIDER_LABELS[p] ?? p}</option>
            ))}
          </select>
        </label>
        <label className="ai-config-label">
          Model
          <select
            value={data.model}
            disabled={isPending}
            onChange={e => handleModelChange(e.target.value)}
          >
            {(data.available_models[data.provider] ?? []).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        {setConfig.isError && (
          <span className="ai-config-error">Failed to save config</span>
        )}
      </div>
    </section>
  )
}
