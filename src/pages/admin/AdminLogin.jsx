/**
 * AdminLogin.jsx
 * Página de inicio de sesión para el panel de administración.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Rellena email y contraseña");
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Bienvenido al panel de administración");
      navigate("/admin/reservas", { replace: true });
    } catch {
      toast.error("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <span className="admin-login__bull">🐂</span>
          <h1 className="admin-login__title">Bulls Barber Shop</h1>
          <p className="admin-login__subtitle">Panel de Administración</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login__form" noValidate>
          <div className="admin-login__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@bullsbarbershop.com"
              disabled={loading}
              required
            />
          </div>

          <div className="admin-login__field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login__btn"
            disabled={loading}
          >
            {loading ? "Iniciando sesión…" : "Entrar"}
          </button>
        </form>
      </div>

      <style>{`
        .admin-login {
          min-height: 100vh;
          background: #0f0f0f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: system-ui, sans-serif;
        }
        .admin-login__card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 1rem;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0,0,0,.5);
        }
        .admin-login__logo {
          text-align: center;
          margin-bottom: 2rem;
        }
        .admin-login__bull { font-size: 2.5rem; }
        .admin-login__title {
          color: #fff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: .5rem 0 .25rem;
        }
        .admin-login__subtitle { color: #888; font-size: .875rem; }
        .admin-login__form { display: flex; flex-direction: column; gap: 1.25rem; }
        .admin-login__field { display: flex; flex-direction: column; gap: .375rem; }
        .admin-login__field label {
          color: #ccc;
          font-size: .875rem;
          font-weight: 500;
        }
        .admin-login__field input {
          background: #0f0f0f;
          border: 1px solid #333;
          border-radius: .5rem;
          color: #fff;
          font-size: .95rem;
          padding: .625rem .875rem;
          outline: none;
          transition: border-color .2s;
        }
        .admin-login__field input:focus { border-color: #CC2020; }
        .admin-login__field input::placeholder { color: #555; }
        .admin-login__btn {
          background: #CC2020;
          border: none;
          border-radius: .5rem;
          color: #fff;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          padding: .75rem;
          margin-top: .5rem;
          transition: background .2s, opacity .2s;
        }
        .admin-login__btn:hover:not(:disabled) { background: #a81a1a; }
        .admin-login__btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
