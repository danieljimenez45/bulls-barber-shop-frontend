/**
 * AdminLogin.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Pantalla de inicio de sesión del panel de administración.
 *
 * Comportamiento:
 *  - Si el usuario ya tiene un token válido → redirige a /admin
 *  - Formulario email + contraseña con validación inline
 *  - Gestión explícita de 401 ("Credenciales incorrectas")
 *  - Spinner durante la petición
 *  - Diseño mobile-first, dark theme con branding dorado de Bulls
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

// ── Constantes ────────────────────────────────────────────────────────────────

/** Ruta a la que redirigir tras un login exitoso */
const REDIRECT_AFTER_LOGIN = "/admin";

// ── Componente ────────────────────────────────────────────────────────────────

export default function AdminLogin() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión activa, no tiene sentido mostrar el login
  useEffect(() => {
    if (isAuthenticated) {
      navigate(REDIRECT_AFTER_LOGIN, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // ── Validación ─────────────────────────────────────────────────────────────

  /** Valida el formulario y devuelve un objeto con los errores encontrados */
  function validate(values) {
    const errs = {};
    if (!values.email.trim()) {
      errs.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errs.email = "Introduce un email válido";
    }
    if (!values.password) {
      errs.password = "La contraseña es obligatoria";
    }
    return errs;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Limpiar el error del campo en cuanto el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      // El useEffect de arriba se encargará de la redirección
    } catch (err) {
      // 401 → credenciales incorrectas; cualquier otro → error genérico
      const status = err?.response?.status;
      if (status === 401) {
        toast.error("Email o contraseña incorrectos");
      } else {
        toast.error("Error de conexión. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logotipo */}
        <header className="login-header">
          <p className="login-brand">BULLS <span>BARBER</span> SHOP</p>
          <p className="login-subtitle">Panel de administración</p>
        </header>

        {/* Formulario */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Formulario de acceso"
        >
          {/* Email */}
          <div className="login-field">
            <label htmlFor="email" className="login-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@bullsbarbershop.com"
              disabled={loading}
              className={`login-input ${errors.email ? "login-input--error" : ""}`}
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <span id="email-error" className="login-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* Contraseña */}
          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className={`login-input ${errors.password ? "login-input--error" : ""}`}
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <span id="password-error" className="login-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                Iniciando sesión…
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>

      {/* ── Estilos ── */}
      <style>{`
        /* Variables de tema — dorado Bulls */
        .login-page {
          --brand:       #CC2020;
          --brand-dim:   rgba(204, 32, 32, .1);
          --brand-hover: #a81a1a;
          --bg-page:     #090909;
          --bg-card:     #111111;
          --bg-input:    #0d0d0d;
          --border:      #2c2c2c;
          --border-focus:#CC2020;
          --text:        #f0f0f0;
          --text-muted:  #888888;
          --error:       #e74c3c;

          min-height: 100vh;
          background: var(--bg-page);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .login-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, .6);
        }

        /* Cabecera */
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .login-brand {
          color: var(--text);
          font-size: 1.4rem;
          font-weight: 900;
          letter-spacing: .05em;
          margin: 0 0 .3rem;
        }
        .login-brand span { color: var(--brand); }
        .login-subtitle {
          color: var(--text-muted);
          font-size: .8125rem;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        /* Formulario */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: .375rem;
        }
        .login-label {
          color: #ccc;
          font-size: .8125rem;
          font-weight: 600;
        }
        .login-input {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: .5rem;
          color: var(--text);
          font-size: .9375rem;
          padding: .625rem .875rem;
          outline: none;
          transition: border-color .2s;
          width: 100%;
        }
        .login-input:focus { border-color: var(--border-focus); }
        .login-input--error { border-color: var(--error); }
        .login-input::placeholder { color: #444; }
        .login-input:disabled { opacity: .5; cursor: not-allowed; }

        /* Mensajes de error */
        .login-error {
          color: var(--error);
          font-size: .75rem;
        }

        /* Botón principal */
        .login-btn {
          align-items: center;
          background: var(--brand);
          border: none;
          border-radius: .5rem;
          color: #fff;
          cursor: pointer;
          display: flex;
          font-size: .9375rem;
          font-weight: 700;
          gap: .5rem;
          justify-content: center;
          margin-top: .5rem;
          padding: .75rem;
          transition: background .2s, opacity .2s;
          width: 100%;
        }
        .login-btn:hover:not(:disabled) { background: var(--brand-hover); }
        .login-btn:disabled { opacity: .6; cursor: not-allowed; }

        /* Spinner */
        .login-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, .3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: login-spin .7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes login-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
