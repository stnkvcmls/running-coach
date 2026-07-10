import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, info)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="error-boundary">
        <div className="card error-boundary-card">
          <AlertTriangle size={32} className="error-boundary-icon" />
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-message">{error.message || 'An unexpected error occurred.'}</p>
          <div className="error-boundary-actions">
            <button type="button" className="btn-primary" onClick={this.handleRetry}>
              Try again
            </button>
            <Link to="/" className="btn-ghost">Go to Today</Link>
          </div>
        </div>
      </div>
    )
  }
}
