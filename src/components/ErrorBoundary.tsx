import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, backgroundColor: '#ffebee', color: '#c62828', height: '100vh', overflow: 'auto' }}>
                    <h1>Si è verificato un errore</h1>
                    <p>Per favore invia uno screenshot di questa schermata allo sviluppatore.</p>
                    <div style={{ backgroundColor: 'white', padding: 15, borderRadius: 5, border: '1px solid #ffcdd2', marginTop: 10 }}>
                        <h3 style={{ marginTop: 0 }}>Errore:</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {this.state.error?.toString()}
                        </pre>
                    </div>
                    {this.state.errorInfo && (
                        <div style={{ backgroundColor: 'white', padding: 15, borderRadius: 5, border: '1px solid #ffcdd2', marginTop: 10 }}>
                            <h3 style={{ marginTop: 0 }}>Dettagli Tecnici (Stack Trace):</h3>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8em' }}>
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </div>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: 20, padding: '10px 20px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: 5, fontSize: '1em' }}
                    >
                        Riprova (Ricarica App)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
