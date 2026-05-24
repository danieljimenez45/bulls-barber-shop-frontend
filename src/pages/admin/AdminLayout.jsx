/**
 * AdminLayout.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Layout principal del panel de administración.
 *
 * Estructura responsive:
 *  - Móvil  (<768px): bottom navigation fija con 5 iconos táctiles
 *  - Desktop (≥768px): sidebar fija a la izquierda + área de contenido
 *
 * Incluye:
 *  - Cabecera con el nombre de la sección activa y botón de logout
 *  - Navegación entre las 5 secciones del panel
 *  - Indicador visual de la sección activa
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

// ── Configuración de la navegación ────────────────────────────────────────────

/**
 * Secciones del panel. El orden importa:
 * en móvil se muestran como tabs en la bottom navigation.
 */
const NAV_ITEMS = [
  { to: "/admin",           label: "Inicio",    icon: "📊", end: true  },
  { to: "/admin/reservas",  label: "Reservas",  icon: "📅", end: false },
  { to: "/admin/servicios", label: "Servicios", icon: "✂️",  end: false },
  { to: "/admin/resenas",   label: "Reseñas",   icon: "⭐", end: false },
  { to: "/admin/galeria",   label: "Galería",   icon: "🖼️",  end: false },
  { to: "/admin/mensajes",  label: "Mensajes",  icon: "✉️",  end: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Devuelve el label de la sección activa en función de la ruta actual.
 * Se usa para mostrar el título en la cabecera.
 */
function getActiveLabel(pathname) {
  // Buscamos la coincidencia más específica (la más larga)
  const match = [...NAV_ITEMS]
    .reverse()
    .find((item) =>
      item.end ? pathname === item.to : pathname.startsWith(item.to),
    );
  return match?.label ?? "Admin";
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeLabel = getActiveLabel(location.pathname);

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="al-root">

      {/* ── Sidebar (solo desktop) ──────────────────────────────────────── */}
      <aside className="al-sidebar" aria-label="Navegación del panel">

        <div className="al-brand">
          <span className="al-brand-name">BULLS <span>BARBER</span></span>
          <span className="al-brand-sub">Panel admin</span>
        </div>

        <nav className="al-sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `al-sidebar-link ${isActive ? "al-sidebar-link--active" : ""}`
              }
            >
              <span className="al-nav-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="al-logout-btn" onClick={handleLogout}>
          <span aria-hidden="true">🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* ── Área principal ──────────────────────────────────────────────── */}
      <div className="al-main-wrapper">

        {/* Cabecera móvil y desktop */}
        <header className="al-header">
          <h1 className="al-header-title">{activeLabel}</h1>
          {/* Botón logout solo visible en desktop (en móvil está en la bottom-nav) */}
          <button
            className="al-header-logout"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            Salir
          </button>
        </header>

        {/* Contenido de la ruta activa */}
        <main className="al-content">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom navigation (solo móvil) ──────────────────────────────── */}
      <nav className="al-bottom-nav" aria-label="Navegación principal">
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `al-bottom-link ${isActive ? "al-bottom-link--active" : ""}`
            }
          >
            <span className="al-bottom-icon" aria-hidden="true">{icon}</span>
            <span className="al-bottom-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Estilos ─────────────────────────────────────────────────────── */}
      <style>{`
        /* Variables de tema dorado */
        .al-root {
          --brand:       #CC2020;
          --brand-dim:   rgba(204, 32, 32, .12);
          --brand-hover: #a81a1a;
          --bg0:         #090909;
          --bg1:         #111111;
          --bg2:         #181818;
          --border:      #2c2c2c;
          --text:        #f0f0f0;
          --text-muted:  #888888;
          --bottom-h:    64px;

          display: flex;
          min-height: 100vh;
          background: var(--bg0);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Sidebar ── */
        .al-sidebar {
          display: none; /* oculto en móvil */
          width: 220px;
          min-width: 220px;
          background: var(--bg1);
          border-right: 1px solid var(--border);
          flex-direction: column;
          padding-bottom: 1.5rem;
        }
        @media (min-width: 768px) {
          .al-sidebar { display: flex; }
        }

        /* Marca en sidebar */
        .al-brand {
          display: flex;
          flex-direction: column;
          gap: .2rem;
          padding: 1.5rem 1.25rem 1.25rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: .75rem;
        }
        .al-brand-name {
          color: #fff;
          font-size: .9375rem;
          font-weight: 900;
          letter-spacing: .04em;
        }
        .al-brand-name span { color: var(--brand); }
        .al-brand-sub {
          color: var(--text-muted);
          font-size: .6875rem;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        /* Links del sidebar */
        .al-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: .125rem;
          padding: 0 .75rem;
          flex: 1;
        }
        .al-sidebar-link {
          align-items: center;
          border-left: 2px solid transparent;
          border-radius: .5rem;
          color: var(--text-muted);
          display: flex;
          font-size: .875rem;
          font-weight: 500;
          gap: .625rem;
          padding: .625rem .875rem;
          text-decoration: none;
          transition: color .15s, background .15s, border-color .15s;
        }
        .al-sidebar-link:hover {
          background: var(--bg2);
          color: #fff;
        }
        .al-sidebar-link--active {
          background: var(--brand-dim);
          border-left-color: var(--brand);
          color: var(--brand);
          font-weight: 600;
        }
        .al-nav-icon { font-size: 1rem; line-height: 1; }

        /* Botón logout sidebar */
        .al-logout-btn {
          align-items: center;
          background: none;
          border: 1px solid var(--border);
          border-radius: .5rem;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          font-size: .8125rem;
          gap: .5rem;
          margin: 1rem .75rem 0;
          padding: .625rem .875rem;
          transition: color .15s, border-color .15s;
        }
        .al-logout-btn:hover {
          border-color: var(--brand);
          color: var(--brand);
        }

        /* ── Área principal ── */
        .al-main-wrapper {
          display: flex;
          flex: 1;
          flex-direction: column;
          min-width: 0; /* evita desbordamiento en flex */
          padding-bottom: var(--bottom-h); /* espacio para la bottom-nav en móvil */
        }
        @media (min-width: 768px) {
          .al-main-wrapper { padding-bottom: 0; }
        }

        /* Cabecera */
        .al-header {
          align-items: center;
          background: var(--bg1);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .al-header-title {
          color: #fff;
          font-size: 1.125rem;
          font-weight: 700;
          margin: 0;
        }
        .al-header-logout {
          background: none;
          border: 1px solid var(--border);
          border-radius: .375rem;
          color: var(--text-muted);
          cursor: pointer;
          display: none; /* solo visible en desktop */
          font-size: .8125rem;
          padding: .375rem .75rem;
          transition: color .15s, border-color .15s;
        }
        .al-header-logout:hover {
          border-color: var(--brand);
          color: var(--brand);
        }
        @media (min-width: 768px) {
          .al-header-logout { display: block; }
        }

        /* Contenido */
        .al-content {
          flex: 1;
          overflow-y: auto;
        }

        /* ── Bottom navigation (móvil) ── */
        .al-bottom-nav {
          background: var(--bg1);
          border-top: 1px solid var(--border);
          bottom: 0;
          display: flex;
          height: var(--bottom-h);
          left: 0;
          position: fixed;
          right: 0;
          z-index: 200;
        }
        @media (min-width: 768px) {
          .al-bottom-nav { display: none; }
        }

        .al-bottom-link {
          align-items: center;
          border-top: 2px solid transparent;
          color: var(--text-muted);
          display: flex;
          flex: 1;
          flex-direction: column;
          font-size: .6875rem;
          font-weight: 500;
          gap: .2rem;
          justify-content: center;
          padding: .25rem .5rem;
          text-decoration: none;
          transition: color .15s, border-color .15s;
        }
        .al-bottom-link:hover { color: #fff; }
        .al-bottom-link--active {
          border-top-color: var(--brand);
          color: var(--brand);
        }
        .al-bottom-icon { font-size: 1.25rem; line-height: 1; }
        .al-bottom-label { line-height: 1; }
      `}</style>
    </div>
  );
}
