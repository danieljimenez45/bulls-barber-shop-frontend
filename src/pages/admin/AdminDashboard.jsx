/**
 * AdminDashboard.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Dashboard principal del panel de administración.
 * Ruta: /admin  (índice del panel)
 *
 * Muestra:
 *  - 3 tarjetas de volumen: citas hoy / semana / mes
 *  - 2 tarjetas de ingresos estimados: semana / mes
 *  - Próxima cita en agenda (nombre, servicio, hora, teléfono)
 *  - Top 5 servicios más solicitados (barras de progreso relativas)
 *  - Distribución de citas por estado (badges con conteo)
 *
 * Mientras carga → skeleton animado.
 * Si hay error    → mensaje con botón "Reintentar".
 *
 * Consume: GET /api/admin/stats
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";
import { getStats } from "../../api/stats";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formatea un número como moneda en euros.
 * @param {number} amount
 * @returns {string} p.ej. "124,50 €"
 */
function formatEur(amount) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea un datetime ISO en fecha y hora legible.
 * @param {string} iso
 * @returns {string} p.ej. "Lunes, 23 jun · 10:00"
 */
function formatDateTime(iso) {
  const date = new Date(iso);
  const dia = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
  const hora = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  // Capitalizar primera letra
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} · ${hora}`;
}

/**
 * Configuración visual de los badges de estado.
 */
const ESTADO_CONFIG = {
  pendiente:  { label: "Pendiente",  color: "#f39c12" },
  confirmada: { label: "Confirmada", color: "#2ecc71" },
  completada: { label: "Completada", color: "#3498db" },
  cancelada:  { label: "Cancelada",  color: "#666"    },
};

// ── Sub-componentes ───────────────────────────────────────────────────────────

/**
 * Tarjeta de métrica simple: etiqueta + valor grande + icono.
 */
function MetricCard({ icon, label, value, accent = false }) {
  return (
    <div className={`db-metric-card ${accent ? "db-metric-card--accent" : ""}`}>
      <span className="db-metric-icon" aria-hidden="true">{icon}</span>
      <div className="db-metric-body">
        <p className="db-metric-label">{label}</p>
        <p className="db-metric-value">{value}</p>
      </div>
    </div>
  );
}

/**
 * Esqueleto animado de carga — imita la forma de las tarjetas reales.
 */
function SkeletonCard({ wide = false }) {
  return (
    <div className={`db-skeleton ${wide ? "db-skeleton--wide" : ""}`}>
      <div className="db-skeleton-line db-skeleton-line--short" />
      <div className="db-skeleton-line db-skeleton-line--long" />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Carga de datos ────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getStats();
      setStats(data);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "No se pudieron cargar las estadísticas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Estados de la UI ──────────────────────────────────────────────────────

  if (loading) return <DashboardSkeleton />;
  if (error)   return <DashboardError message={error} onRetry={fetchStats} />;

  // Calcular el máximo para las barras de progreso de servicios
  const maxServicio = Math.max(
    1,
    ...stats.servicios_mas_solicitados.map((s) => s.total),
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="db-page">

      {/* ── Sección: Volumen de citas ──────────────────────────────────── */}
      <section className="db-section" aria-label="Volumen de citas">
        <h2 className="db-section-title">Citas</h2>
        <div className="db-metrics-grid">
          <MetricCard icon="📅" label="Hoy"         value={stats.citas_hoy}    />
          <MetricCard icon="📆" label="Esta semana" value={stats.citas_semana} />
          <MetricCard icon="🗓️" label="Este mes"    value={stats.citas_mes}    />
        </div>
      </section>

      {/* ── Sección: Ingresos estimados ────────────────────────────────── */}
      <section className="db-section" aria-label="Ingresos estimados">
        <h2 className="db-section-title">Ingresos estimados</h2>
        <div className="db-metrics-grid db-metrics-grid--2col">
          <MetricCard
            icon="💰"
            label="Esta semana"
            value={formatEur(stats.ingresos_estimados_semana)}
            accent
          />
          <MetricCard
            icon="💶"
            label="Este mes"
            value={formatEur(stats.ingresos_estimados_mes)}
            accent
          />
        </div>
      </section>

      {/* ── Sección: Próxima cita ──────────────────────────────────────── */}
      <section className="db-section" aria-label="Próxima cita">
        <h2 className="db-section-title">Próxima cita</h2>
        {stats.proxima_cita ? (
          <div className="db-next-card">
            <div className="db-next-header">
              <span className="db-next-service">
                {stats.proxima_cita.servicio_nombre ?? "Servicio sin nombre"}
              </span>
              <span className="db-next-estado">
                {ESTADO_CONFIG[stats.proxima_cita.estado]?.label ?? stats.proxima_cita.estado}
              </span>
            </div>
            <p className="db-next-client">{stats.proxima_cita.nombre_cliente}</p>
            <p className="db-next-datetime">{formatDateTime(stats.proxima_cita.fecha_hora)}</p>
            <a
              href={`tel:${stats.proxima_cita.telefono}`}
              className="db-next-phone"
              aria-label={`Llamar a ${stats.proxima_cita.nombre_cliente}`}
            >
              📞 {stats.proxima_cita.telefono}
            </a>
          </div>
        ) : (
          <p className="db-empty">No hay citas pendientes en agenda.</p>
        )}
      </section>

      {/* ── Sección: Servicios más solicitados ────────────────────────── */}
      {stats.servicios_mas_solicitados.length > 0 && (
        <section className="db-section" aria-label="Servicios más solicitados">
          <h2 className="db-section-title">Top servicios</h2>
          <div className="db-services-list">
            {stats.servicios_mas_solicitados.map((srv) => (
              <div key={srv.servicio_id} className="db-service-row">
                <span className="db-service-name">
                  {srv.nombre ?? `Servicio #${srv.servicio_id}`}
                </span>
                <div className="db-service-bar-wrap" aria-label={`${srv.total} citas`}>
                  <div
                    className="db-service-bar"
                    style={{ width: `${(srv.total / maxServicio) * 100}%` }}
                  />
                </div>
                <span className="db-service-total">{srv.total}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Sección: Distribución por estado ──────────────────────────── */}
      <section className="db-section" aria-label="Distribución por estado">
        <h2 className="db-section-title">Por estado</h2>
        <div className="db-estados-grid">
          {Object.entries(stats.distribucion_por_estado).map(([estado, count]) => {
            const cfg = ESTADO_CONFIG[estado] ?? { label: estado, color: "#888" };
            return (
              <div key={estado} className="db-estado-badge">
                <span
                  className="db-estado-dot"
                  style={{ background: cfg.color }}
                  aria-hidden="true"
                />
                <span className="db-estado-label">{cfg.label}</span>
                <span className="db-estado-count">{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Estilos ─────────────────────────────────────────────────────── */}
      <style>{`
        .db-page {
          --brand:      #CC2020;
          --brand-dim:  rgba(204, 32, 32, .12);
          --bg1:        #111111;
          --bg2:        #181818;
          --border:     #2c2c2c;
          --text:       #f0f0f0;
          --text-muted: #888888;

          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Sección ── */
        .db-section { display: flex; flex-direction: column; gap: .875rem; }
        .db-section-title {
          color: var(--text-muted);
          font-size: .6875rem;
          font-weight: 800;
          letter-spacing: .1em;
          margin: 0;
          text-transform: uppercase;
        }

        /* ── Grid de métricas ── */
        .db-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .75rem;
        }
        .db-metrics-grid--2col { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 480px) {
          .db-metrics-grid        { grid-template-columns: repeat(2, 1fr); }
          .db-metrics-grid--2col  { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Tarjeta de métrica ── */
        .db-metric-card {
          align-items: center;
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          gap: .75rem;
          padding: 1rem 1.25rem;
        }
        .db-metric-card--accent {
          border-color: rgba(204, 32, 32, .3);
          background: var(--brand-dim);
        }
        .db-metric-icon { font-size: 1.5rem; line-height: 1; }
        .db-metric-body { min-width: 0; }
        .db-metric-label {
          color: var(--text-muted);
          font-size: .75rem;
          margin: 0;
          white-space: nowrap;
        }
        .db-metric-value {
          color: #fff;
          font-size: 1.5rem;
          font-weight: 800;
          margin: .125rem 0 0;
          font-variant-numeric: tabular-nums;
        }
        .db-metric-card--accent .db-metric-value { color: var(--brand); }

        /* ── Próxima cita ── */
        .db-next-card {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-left: 3px solid var(--brand);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          gap: .375rem;
          padding: 1.25rem;
        }
        .db-next-header {
          align-items: center;
          display: flex;
          justify-content: space-between;
          gap: .5rem;
        }
        .db-next-service {
          color: var(--brand);
          font-size: .8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .db-next-estado {
          background: var(--brand-dim);
          border-radius: 999px;
          color: var(--brand);
          font-size: .6875rem;
          font-weight: 700;
          padding: .2rem .625rem;
        }
        .db-next-client {
          color: #fff;
          font-size: 1.125rem;
          font-weight: 700;
          margin: .25rem 0 0;
        }
        .db-next-datetime {
          color: var(--text-muted);
          font-size: .875rem;
          margin: 0;
        }
        .db-next-phone {
          color: var(--brand);
          font-size: .875rem;
          font-weight: 600;
          margin-top: .25rem;
          text-decoration: none;
          width: fit-content;
        }
        .db-next-phone:hover { text-decoration: underline; }

        /* ── Top servicios ── */
        .db-services-list {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .db-service-row {
          align-items: center;
          border-bottom: 1px solid var(--border);
          display: grid;
          gap: .75rem;
          grid-template-columns: 1fr 2fr auto;
          padding: .75rem 1.25rem;
        }
        .db-service-row:last-child { border-bottom: none; }
        .db-service-name {
          color: var(--text);
          font-size: .875rem;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .db-service-bar-wrap {
          background: var(--border);
          border-radius: 999px;
          height: 6px;
          overflow: hidden;
        }
        .db-service-bar {
          background: var(--brand);
          border-radius: 999px;
          height: 100%;
          min-width: 4px;
          transition: width .4s ease;
        }
        .db-service-total {
          color: var(--text-muted);
          font-size: .8125rem;
          font-variant-numeric: tabular-nums;
          text-align: right;
          min-width: 1.5rem;
        }

        /* ── Distribución por estado ── */
        .db-estados-grid {
          display: flex;
          flex-wrap: wrap;
          gap: .625rem;
        }
        .db-estado-badge {
          align-items: center;
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .5rem;
          display: flex;
          gap: .5rem;
          padding: .625rem 1rem;
        }
        .db-estado-dot {
          border-radius: 50%;
          flex-shrink: 0;
          height: 8px;
          width: 8px;
        }
        .db-estado-label {
          color: var(--text-muted);
          font-size: .8125rem;
        }
        .db-estado-count {
          color: #fff;
          font-size: .875rem;
          font-variant-numeric: tabular-nums;
          font-weight: 700;
        }

        /* ── Estado vacío ── */
        .db-empty {
          color: var(--text-muted);
          font-size: .875rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// ── Estados de carga y error ──────────────────────────────────────────────────

/**
 * Esqueleto de carga que imita la estructura del dashboard real.
 */
function DashboardSkeleton() {
  return (
    <div className="db-page">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .db-skeleton {
          background: #181818;
          border: 1px solid #2c2c2c;
          border-radius: .75rem;
          height: 80px;
          background-image: linear-gradient(90deg, #181818 25%, #222 50%, #181818 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite linear;
        }
        .db-skeleton--wide { height: 120px; }
        .db-sk-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: .75rem; }
        .db-sk-grid--2 { grid-template-columns: repeat(2,1fr); }
      `}</style>
      <div className="db-sk-grid">
        <div className="db-skeleton" /><div className="db-skeleton" /><div className="db-skeleton" />
      </div>
      <div className="db-sk-grid db-sk-grid--2">
        <div className="db-skeleton" /><div className="db-skeleton" />
      </div>
      <div className="db-skeleton db-skeleton--wide" />
      <div className="db-skeleton" />
    </div>
  );
}

/**
 * Mensaje de error con botón para reintentar la carga.
 */
function DashboardError({ message, onRetry }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
      <p style={{ marginBottom: "1rem" }}>⚠️ {message}</p>
      <button
        onClick={onRetry}
        style={{
          background: "#CC2020",
          border: "none",
          borderRadius: ".5rem",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 700,
          padding: ".5rem 1.25rem",
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
