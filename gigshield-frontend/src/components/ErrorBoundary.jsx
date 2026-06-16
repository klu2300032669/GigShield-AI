import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(251,113,133,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              border: '2px solid rgba(251,113,133,0.25)',
            }}
          >
            <AlertTriangle size={36} style={{ color: 'var(--accent-rose, #fb7185)' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400 }}>
            An unexpected error occurred. Our team has been notified. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details style={{ marginBottom: 24, textAlign: 'left', maxWidth: 500 }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Technical details
              </summary>
              <pre style={{
                fontSize: '0.75rem',
                padding: '12px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                overflow: 'auto',
                marginTop: 8,
                color: 'var(--accent-rose)',
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={this.handleReset}
              aria-label="Try again"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <button
              className="btn btn-outline"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
