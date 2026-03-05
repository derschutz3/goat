import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
          <h2>Algo deu errado.</h2>
          <p style={{ color: '#ef4444', marginTop: 10 }}>{this.state.error?.message || 'Erro desconhecido'}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 20, padding: '10px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Recarregar Página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
