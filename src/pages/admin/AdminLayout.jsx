/**
 * AdminLayout.jsx
 * Envuelve todas las rutas del panel de administración.
 * - Si el usuario no está autenticado, redirige a /admin/login.
 * - Proporciona la barra lateral de navegación y la cabecera.
 */

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/admin/reservas",  label: "Reservas",  icon: "📅" },
  { to: "/admin/servicios", label: "Servicios",  icon: "✂️" },
  { to: "/admin/resenas",   label: "Reseñas",    icon: "⭐" },
  { to: "/admin/galeria",   label: "Galería",    icon: "🖼️" },
  { to: "/admin/stats",     label: "Estadísticas", icon: "📊" },
];

export default function AdminLayout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Guard: redirige al login si no hay token
  if (!isAuthenticated) {
    // Usamos navigate en el render sería incorrecto; usamos una redirección directa
    navigate("/admin/login", { replace: true });
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    navigate("/admin/login");
  };

  return (
    <div className="al-root">
      {/* ── Barra lateral ─────────────────────────────────────────────────── */}
      <aside className="al-sidebar">
        <div className="al-brand">
          <span className="al-brand__icon">🐂</span>
          <span className="al-brand__name">Bulls Admin</span>
        </div>

        <nav className="al-nav" aria-label="Navegación del panel">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `al-nav__link${isActive ? " al-nav__link--active" : ""}`
              }
            >
              <span className="al-nav__icon" aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="al-logout" onClick={handleLogout}>
          <span aria-hidden="true">🚪</span> Cerrar sesión
        </button>
      </aside>

      {/* ── Área principal ────────────────────────────────────────────────── */}
      <main className="al-main">
        <Outlet />
      </main>

      <style>{`
        .al-root {
          display: flex;
          min-height: 100vh;
          background: #0f0f0f;
          font-family: system-ui, sans-serif;
        }
        /* ── Sidebar ── */
        .al-sidebar {
          width: 220px;
          min-width: 220px;
          background: #1a1a1a;
          border-right: 1px solid #2a2a2a;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 0;
        }
        .al-brand {
          display: flex;
          align-items: center;
          gap: .625rem;
          padding: 0 1.25rem 1.5rem;
          border-bottom: 1px solid #2a2a2a;
          margin-bottom: 1rem;
        }
        .al-brand__icon { font-size: 1.6rem; }
        .al-brand__name { color: #fff; font-weight: 700; font-size: 1rem; }
        /* ── Nav links ── */
        .al-nav { display: flex; flex-direction: column; gap: .25rem; padding: 0 .75rem; flex: 1; }
        .al-nav__link {
          display: flex;
          align-items: center;
          gap: .625rem;
          color: #888;
          text-decoration: none;
          padding: .625rem .875rem;
          border-radius: .5rem;
          font-size: .9rem;
          font-weight: 500;
          transition: color .15s, background .15s;
        }
        .al-nav__link:hover { color: #fff; background: #232323; }
        .al-nav__link--active { color: #fff; background: #CC2020; }
        .al-nav__icon { font-size: 1rem; line-height: 1; }
        /* ── Logout ── */
        .al-logout {
          margin: 1rem .75rem 0;
          background: none;
          border: 1px solid #2a2a2a;
          border-radius: .5rem;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: .5rem;
          font-size: .875rem;
          padding: .625rem .875rem;
          transition: color .15s, border-color .15s;
        }
        .al-logout:hover { color: #fff; border-color: #444; }
        /* ── Main ── */
        .al-main { flex: 1; overflow-y: auto; }

        @media (max-width: 768px) {
          .al-root { flex-direction: column; }
          .al-sidebar {
            width: 100%;
            min-width: 0;
            flex-direction: row;
            flex-wrap: wrap;
            padding: .75rem;
            gap: .5rem;
          }
          .al-brand { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
          .al-nav { flex-direction: row; flex-wrap: wrap; }
          .al-logout { margin: 0; }
        }
      `}</style>
    </div>
  );
}
