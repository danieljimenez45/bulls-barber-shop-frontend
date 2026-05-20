import { Component } from "react";
import { Link } from "react-router-dom";
import "./ErrorBoundary.css";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // En producción aquí se enviaría a Sentry u otro servicio
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary__content">
          <div className="accent-line" />
          <h1 className="error-boundary__title">Algo salió mal</h1>
          <p className="error-boundary__text">
            Ha ocurrido un error inesperado. Puedes intentar recargar la página
            o volver al inicio.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="error-boundary__detail">
              {this.state.error.message}
            </pre>
          )}
          <div className="error-boundary__actions">
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </button>
            <Link
              to="/"
              className="btn btn-outline"
              onClick={this.handleReset}
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
