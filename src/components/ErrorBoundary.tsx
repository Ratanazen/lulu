import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Lulu ErrorBoundary caught an unhandled exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (confirm('Are you sure you want to reset local storage caches? Your SQLite database will remain safe.')) {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '260px',
            padding: '24px',
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            borderRadius: '16px',
            border: '1px solid #EF4444',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🩹</div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#F87171', margin: '0 0 8px' }}>
            {this.props.fallbackTitle || 'Lulu Encountered a Hiccup'}
          </h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '320px', margin: '0 0 16px', lineHeight: '1.4' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRecover}
              style={{
                backgroundColor: '#3B82F6',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try Recovering
            </button>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#1E293B',
                color: '#CBD5E1',
                border: '1px solid #334155',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Reload Window
            </button>
            <button
              onClick={this.handleResetStorage}
              style={{
                backgroundColor: 'transparent',
                color: '#94A3B8',
                border: 'none',
                padding: '6px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Reset Cache
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
