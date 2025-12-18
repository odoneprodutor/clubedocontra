import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Explicitly declare props for TS
  props: ErrorBoundaryProps;


  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', height: '100vh', backgroundColor: '#fef2f2', color: '#991b1b', overflow: 'auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Aplicação Quebrou (Erro de Runtime)</h1>
          <p style={{ marginBottom: '1rem' }}>Ocorreu um erro ao renderizar o componente. Detalhes abaixo:</p>
          <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fecaca', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            <strong>{this.state.error?.toString()}</strong>
            <br />
            {this.state.error?.stack}
          </div>
          <button onClick={() => window.location.reload()} style={{ marginTop: '2rem', padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.375rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);