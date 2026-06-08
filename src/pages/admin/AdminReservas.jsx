/**
 * AdminReservas.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Panel de gestión de reservas.
 *
 * A-08:
 *  - Vista card en móvil / tabla en desktop (≥768 px)
 *  - Chips de filtro por estado con conteo en tiempo real
 *  - Búsqueda client-side por nombre o teléfono
 *  - Skeleton animado durante la carga
 *
 * A-09:
 *  - Modal de confirmación antes de cancelar (acción destructiva)
 *  - Botones de acción directa para confirmar y completar
 *  - Select de cambio de estado para correcciones rápidas
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { listBookings, updateBooking, cancelBooking } from "../../api/bookings";
import ExportCSVModal from "../../components/admin/ExportCSVModal";

// ── Constantes ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const ESTADOS = ["pendiente", "confirmada", "completada", "cancelada"];

const ESTADO_CFG = {
  pendiente:  { label: "Pendiente",  color: "#eab308", bg: "rgba(234,179,8,.12)"   },
  confirmada: { label: "Confirmada", color: "#22c55e", bg: "rgba(34,197,94,.12)"   },
  completada: { label: "Completada", color: "#60a5fa", bg: "rgba(59,130,246,.12)"  },
  cancelada:  { label: "Cancelada",  color: "#888",    bg: "rgba(100,100,100,.12)" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function Badge({ estado }) {
  const cfg = ESTADO_CFG[estado] ?? { label: estado, color: "#888", bg: "rgba(100,100,100,.12)" };
  return (
    <span
      className="ar-badge"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

/** Fila de esqueleto para la tabla desktop */
function SkeletonRow() {
  return (
    <tr className="ar-skeleton-row">
      {Array.from({ length: 6 }, (_, i) => (
        <td key={i}><div className="ar-sk-cell" /></td>
      ))}
    </tr>
  );
}

/** Tarjeta esqueleto para móvil */
function SkeletonCard() {
  return (
    <div className="ar-card ar-skeleton-card">
      <div className="ar-sk-line ar-sk-short" />
      <div className="ar-sk-line ar-sk-long"  />
      <div className="ar-sk-line ar-sk-med"   />
    </div>
  );
}

/**
 * Modal de confirmación de cancelación (A-09).
 * Se cierra con Escape o pulsando el fondo.
 */
function CancelModal({ booking, onConfirm, onClose, loading }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="ar-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar cancelación"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ar-modal">
        <div className="ar-modal-icon" aria-hidden="true">⚠️</div>
        <h2 className="ar-modal-title">¿Cancelar esta reserva?</h2>
        <p className="ar-modal-desc">Esta acción no se puede deshacer.</p>

        <div className="ar-modal-booking">
          <div className="ar-modal-row">
            <span className="ar-modal-label">Cliente</span>
            <span className="ar-modal-value">{booking.nombre_cliente}</span>
          </div>
          <div className="ar-modal-row">
            <span className="ar-modal-label">Servicio</span>
            <span className="ar-modal-value">{booking.servicio_nombre || `#${booking.servicio_id}`}</span>
          </div>
          <div className="ar-modal-row">
            <span className="ar-modal-label">Fecha</span>
            <span className="ar-modal-value">{formatDateTime(booking.fecha_hora)}</span>
          </div>
          <div className="ar-modal-row">
            <span className="ar-modal-label">Teléfono</span>
            <span className="ar-modal-value">{booking.telefono}</span>
          </div>
        </div>

        <div className="ar-modal-actions">
          <button
            className="ar-btn ar-btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Volver
          </button>
          <button
            className="ar-btn ar-btn--danger"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Cancelando…" : "Sí, cancelar reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de reserva para móvil.
 * Muestra todos los datos y los botones de acción.
 */
function BookingCard({ booking, onEstadoChange, updating }) {
  const isBusy = updating === booking.id;

  return (
    <article className={`ar-card ${isBusy ? "ar-card--busy" : ""}`}>
      {/* Cabecera: nombre + badge estado */}
      <div className="ar-card-header">
        <div>
          <p className="ar-card-name">{booking.nombre_cliente}</p>
          {booking.email && <p className="ar-card-email">{booking.email}</p>}
        </div>
        <Badge estado={booking.estado} />
      </div>

      {/* Datos */}
      <div className="ar-card-body">
        <div className="ar-card-row">
          <span className="ar-card-label">📞</span>
          <a href={`tel:${booking.telefono}`} className="ar-card-phone">
            {booking.telefono}
          </a>
        </div>
        <div className="ar-card-row">
          <span className="ar-card-label">✂️</span>
          <span>{booking.servicio_nombre || `Servicio #${booking.servicio_id}`}</span>
        </div>
        <div className="ar-card-row">
          <span className="ar-card-label">📅</span>
          <span className="ar-card-fecha">{formatDateTime(booking.fecha_hora)}</span>
        </div>
        {booking.barbero && booking.barbero !== "Cualquier barbero" && (
          <div className="ar-card-row">
            <span className="ar-card-label">💈</span>
            <span>{booking.barbero}</span>
          </div>
        )}
        {booking.notas && (
          <div className="ar-card-row ar-card-row--notes">
            <span className="ar-card-label">📝</span>
            <span className="ar-card-notes">{booking.notas}</span>
          </div>
        )}
      </div>

      {/* Acciones */}
      {booking.estado !== "cancelada" && (
        <div className="ar-card-actions">
          {booking.estado === "pendiente" && (
            <button
              className="ar-btn ar-btn--confirm"
              onClick={() => onEstadoChange(booking, "confirmada")}
              disabled={isBusy}
            >
              ✓ Confirmar
            </button>
          )}
          {(booking.estado === "pendiente" || booking.estado === "confirmada") && (
            <button
              className="ar-btn ar-btn--complete"
              onClick={() => onEstadoChange(booking, "completada")}
              disabled={isBusy}
            >
              ✓ Completar
            </button>
          )}
          <button
            className="ar-btn ar-btn--cancel"
            onClick={() => onEstadoChange(booking, "cancelada")}
            disabled={isBusy}
          >
            ✕ Cancelar
          </button>
        </div>
      )}
    </article>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminReservas() {
  // Datos de la página actual (server-side)
  const [items,         setItems]         = useState([]);
  const [total,         setTotal]         = useState(0);
  const [counts,        setCounts]        = useState({ "": 0 });
  const [loading,       setLoading]       = useState(true);
  const [filtroEstado,  setFiltroEstado]  = useState("");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [page,          setPage]          = useState(1);
  const [showExport,    setShowExport]    = useState(false);
  const [updatingId,    setUpdatingId]    = useState(null);
  const [cancelTarget,  setCancelTarget]  = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── Carga de datos (server-side) ──────────────────────────────────────────

  const fetchPage = useCallback(async (p, estado) => {
    setLoading(true);
    try {
      const { data } = await listBookings({
        page: p,
        size: PAGE_SIZE,
        estado: estado || undefined,
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch conteos por estado (peticiones pequeñas, una vez al montar y tras mutaciones)
  const fetchCounts = useCallback(async () => {
    try {
      const results = await Promise.all([
        listBookings({ page: 1, size: 1 }),
        ...ESTADOS.map((e) => listBookings({ page: 1, size: 1, estado: e })),
      ]);
      const [all, ...perEstado] = results;
      setCounts({
        "": all.data.total ?? 0,
        ...Object.fromEntries(ESTADOS.map((e, i) => [e, perEstado[i].data.total ?? 0])),
      });
    } catch { /* silenciar — los chips funcionan sin conteos */ }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchPage(1, "");
    fetchCounts();
  }, [fetchPage, fetchCounts]);

  // Al cambiar filtro → volver a página 1
  useEffect(() => {
    setPage(1);
    fetchPage(1, filtroEstado);
  }, [filtroEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar de página
  useEffect(() => {
    fetchPage(page, filtroEstado);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda client-side sobre los items de la página actual
  const paginated = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (b) =>
        b.nombre_cliente?.toLowerCase().includes(q) ||
        b.telefono?.includes(q),
    );
  }, [items, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Acciones ──────────────────────────────────────────────────────────────

  const applyEstadoChange = useCallback(async (booking, nuevoEstado) => {
    if (nuevoEstado === booking.estado) return;
    setUpdatingId(booking.id);
    try {
      await updateBooking(booking.id, { estado: nuevoEstado });
      // Actualizar optimistamente en la lista local
      setItems((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, estado: nuevoEstado } : b)),
      );
      toast.success(`Reserva actualizada → ${ESTADO_CFG[nuevoEstado]?.label}`);
      fetchCounts();
    } catch {
      toast.error("No se pudo actualizar la reserva");
    } finally {
      setUpdatingId(null);
    }
  }, [fetchCounts]);

  const handleEstadoChange = useCallback((booking, nuevoEstado) => {
    if (nuevoEstado === "cancelada") {
      setCancelTarget(booking);
    } else {
      applyEstadoChange(booking, nuevoEstado);
    }
  }, [applyEstadoChange]);

  const handleConfirmCancel = useCallback(async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await cancelBooking(cancelTarget.id);
      setItems((prev) =>
        prev.map((b) => (b.id === cancelTarget.id ? { ...b, estado: "cancelada" } : b)),
      );
      toast.success("Reserva cancelada");
      setCancelTarget(null);
      fetchCounts();
    } catch {
      toast.error("No se pudo cancelar la reserva");
    } finally {
      setCancelLoading(false);
    }
  }, [cancelTarget, fetchCounts]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="ar-page">

      {/* ── Cabecera ──────────────────────────────────────────────────── */}
      <div className="ar-header">
        <div className="ar-header-left">
          <span className="ar-total">{counts[""] ?? 0} reservas</span>
        </div>
        <div className="ar-header-right">
          {/* Búsqueda */}
          <div className="ar-search-wrap">
            <span className="ar-search-icon" aria-hidden="true">🔍</span>
            <input
              className="ar-search"
              type="search"
              placeholder="Nombre o teléfono…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar reserva por nombre o teléfono"
            />
          </div>

          {/* Exportar */}
          <button
            className="ar-btn ar-btn--export"
            onClick={() => setShowExport(true)}
            aria-label="Exportar reservas a CSV"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            CSV
          </button>
        </div>
      </div>

      {/* ── Chips de filtro (A-08) ─────────────────────────────────────── */}
      <div className="ar-chips" role="group" aria-label="Filtrar por estado">
        {[{ key: "", label: "Todas" }, ...ESTADOS.map((e) => ({ key: e, label: ESTADO_CFG[e].label }))].map(
          ({ key, label }) => (
            <button
              key={key}
              className={`ar-chip ${filtroEstado === key ? "ar-chip--active" : ""}`}
              onClick={() => setFiltroEstado(key)}
              style={
                filtroEstado === key && key
                  ? { borderColor: ESTADO_CFG[key].color, color: ESTADO_CFG[key].color,
                      background: ESTADO_CFG[key].bg }
                  : {}
              }
            >
              {label}
              <span className="ar-chip-count">{counts[key] ?? 0}</span>
            </button>
          ),
        )}
      </div>

      {/* ── Resultado de búsqueda ─────────────────────────────────────── */}
      {searchQuery && !loading && (
        <p className="ar-search-result">
          {paginated.length === 0
            ? `Sin resultados para "${searchQuery}" en esta página`
            : `${paginated.length} resultado${paginated.length !== 1 ? "s" : ""} para "${searchQuery}"`}
        </p>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VISTA DESKTOP — tabla
      ════════════════════════════════════════════════════════════════ */}
      <div className="ar-table-wrap ar-desktop-only">
        <table className="ar-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Servicio</th>
              <th>Fecha y hora</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)
              : paginated.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="ar-empty-cell">
                    No hay reservas{filtroEstado ? ` con estado "${ESTADO_CFG[filtroEstado]?.label}"` : ""}.
                  </td>
                </tr>
              )
              : paginated.map((b) => (
                <tr
                  key={b.id}
                  className={updatingId === b.id ? "ar-row--busy" : ""}
                >
                  <td className="ar-col-id">{b.id}</td>
                  <td>
                    <span className="ar-cliente">{b.nombre_cliente}</span>
                    {b.email && <span className="ar-email">{b.email}</span>}
                  </td>
                  <td>
                    <a href={`tel:${b.telefono}`} className="ar-tel-link">{b.telefono}</a>
                  </td>
                  <td>{b.servicio_nombre || `#${b.servicio_id}`}</td>
                  <td className="ar-col-fecha">{formatDateTime(b.fecha_hora)}</td>
                  <td><Badge estado={b.estado} /></td>
                  <td>
                    <div className="ar-row-actions">
                      {b.estado === "pendiente" && (
                        <button
                          className="ar-btn ar-btn--sm ar-btn--confirm"
                          onClick={() => applyEstadoChange(b, "confirmada")}
                          disabled={updatingId === b.id}
                          title="Confirmar"
                        >✓ Confirmar</button>
                      )}
                      {(b.estado === "pendiente" || b.estado === "confirmada") && (
                        <button
                          className="ar-btn ar-btn--sm ar-btn--complete"
                          onClick={() => applyEstadoChange(b, "completada")}
                          disabled={updatingId === b.id}
                          title="Completar"
                        >✓ Completar</button>
                      )}
                      {b.estado !== "cancelada" && (
                        <button
                          className="ar-btn ar-btn--sm ar-btn--cancel"
                          onClick={() => setCancelTarget(b)}
                          disabled={updatingId === b.id}
                          title="Cancelar"
                        >✕</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          VISTA MÓVIL — cards (A-08)
      ════════════════════════════════════════════════════════════════ */}
      <div className="ar-cards ar-mobile-only">
        {loading
          ? Array.from({ length: 5 }, (_, i) => <SkeletonCard key={i} />)
          : paginated.length === 0
          ? (
            <div className="ar-empty">
              No hay reservas{filtroEstado ? ` con estado "${ESTADO_CFG[filtroEstado]?.label}"` : ""}.
            </div>
          )
          : paginated.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onEstadoChange={handleEstadoChange}
              updating={updatingId}
            />
          ))}
      </div>

      {/* ── Paginación ─────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="ar-pagination">
          <button
            className="ar-btn ar-btn--page"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >← Anterior</button>
          <span className="ar-page-info">
            {page} / {totalPages}
            <span className="ar-page-sub"> ({total} reservas)</span>
          </span>
          <button
            className="ar-btn ar-btn--page"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >Siguiente →</button>
        </div>
      )}

      {/* ── Modal exportar CSV ─────────────────────────────────────────── */}
      {showExport && <ExportCSVModal onClose={() => setShowExport(false)} />}

      {/* ── Modal cancelación (A-09) ───────────────────────────────────── */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleConfirmCancel}
          onClose={() => setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}

      {/* ── Estilos ───────────────────────────────────────────────────── */}
      <style>{`
        .ar-page {
          --brand:       #CC2020;
          --brand-dim:   rgba(204,32,32,.12);
          --brand-hover: #a81a1a;
          --bg1:         #111111;
          --bg2:         #181818;
          --border:      #2c2c2c;
          --text:        #f0f0f0;
          --text-muted:  #888888;
          --danger:      #e74c3c;

          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Cabecera ── */
        .ar-header {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: .75rem;
          justify-content: space-between;
        }
        .ar-header-left { display: flex; align-items: center; gap: .75rem; }
        .ar-header-right { display: flex; align-items: center; gap: .625rem; flex-wrap: wrap; }
        .ar-total {
          color: var(--text-muted);
          font-size: .8125rem;
          font-variant-numeric: tabular-nums;
        }

        /* ── Búsqueda ── */
        .ar-search-wrap {
          align-items: center;
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .5rem;
          display: flex;
          gap: .5rem;
          padding: .375rem .75rem;
          transition: border-color .2s;
        }
        .ar-search-wrap:focus-within { border-color: var(--brand); }
        .ar-search-icon { font-size: .875rem; }
        .ar-search {
          background: none;
          border: none;
          color: var(--text);
          font-size: .875rem;
          outline: none;
          width: 160px;
        }
        .ar-search::placeholder { color: var(--text-muted); }

        /* ── Chips de filtro ── */
        .ar-chips {
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
        }
        .ar-chip {
          align-items: center;
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          font-size: .8125rem;
          font-weight: 500;
          gap: .375rem;
          padding: .35rem .875rem;
          transition: color .15s, border-color .15s, background .15s;
        }
        .ar-chip:hover { color: #fff; border-color: #444; }
        .ar-chip--active {
          border-color: var(--brand);
          color: var(--brand);
          background: var(--brand-dim);
          font-weight: 700;
        }
        .ar-chip-count {
          background: rgba(255,255,255,.07);
          border-radius: 999px;
          font-size: .6875rem;
          padding: .1rem .4rem;
        }

        /* ── Resultado búsqueda ── */
        .ar-search-result {
          color: var(--text-muted);
          font-size: .8125rem;
          margin: 0;
        }

        /* ── Responsive visibility ── */
        .ar-desktop-only { display: block; }
        .ar-mobile-only  { display: none;  }
        @media (max-width: 767px) {
          .ar-desktop-only { display: none;  }
          .ar-mobile-only  { display: flex; flex-direction: column; gap: .75rem; }
        }

        /* ══════════════════════════════════════════════════
           TABLA DESKTOP
        ══════════════════════════════════════════════════ */
        .ar-table-wrap {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          overflow-x: auto;
        }
        .ar-table {
          border-collapse: collapse;
          font-size: .875rem;
          width: 100%;
        }
        .ar-table th {
          background: #0d0d0d;
          color: var(--text-muted);
          font-size: .6875rem;
          font-weight: 700;
          letter-spacing: .07em;
          padding: .875rem 1rem;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .ar-table td {
          border-top: 1px solid #1a1a1a;
          color: #ddd;
          padding: .8rem 1rem;
          vertical-align: middle;
        }
        .ar-row--busy { opacity: .5; pointer-events: none; }
        .ar-col-id    { color: var(--text-muted); font-size: .8rem; font-variant-numeric: tabular-nums; }
        .ar-col-fecha { white-space: nowrap; font-variant-numeric: tabular-nums; }
        .ar-cliente   { color: #fff; font-weight: 600; display: block; }
        .ar-email     { color: var(--text-muted); font-size: .75rem; display: block; margin-top: .1rem; }
        .ar-tel-link  { color: var(--text-muted); text-decoration: none; }
        .ar-tel-link:hover { color: var(--brand); }
        .ar-empty-cell { color: var(--text-muted); padding: 3rem; text-align: center; }

        /* Acciones en fila */
        .ar-row-actions {
          align-items: center;
          display: flex;
          gap: .375rem;
          flex-wrap: wrap;
        }

        /* Badge de estado */
        .ar-badge {
          border-radius: 999px;
          font-size: .6875rem;
          font-weight: 700;
          padding: .2rem .625rem;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        /* ══════════════════════════════════════════════════
           CARDS MÓVIL (A-08)
        ══════════════════════════════════════════════════ */
        .ar-card {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          gap: .75rem;
          padding: 1.125rem;
          transition: border-color .2s;
        }
        .ar-card--busy { opacity: .5; pointer-events: none; }

        .ar-card-header {
          align-items: flex-start;
          display: flex;
          justify-content: space-between;
          gap: .5rem;
        }
        .ar-card-name  { color: #fff; font-size: .9375rem; font-weight: 700; margin: 0; }
        .ar-card-email { color: var(--text-muted); font-size: .75rem; margin: .1rem 0 0; }

        .ar-card-body {
          display: flex;
          flex-direction: column;
          gap: .375rem;
        }
        .ar-card-row {
          align-items: baseline;
          color: var(--text);
          display: flex;
          font-size: .875rem;
          gap: .5rem;
        }
        .ar-card-row--notes { align-items: flex-start; }
        .ar-card-label  { flex-shrink: 0; font-size: .875rem; }
        .ar-card-phone  { color: var(--text-muted); text-decoration: none; }
        .ar-card-phone:hover { color: var(--brand); }
        .ar-card-fecha  { font-variant-numeric: tabular-nums; }
        .ar-card-notes  { color: var(--text-muted); font-size: .8125rem; font-style: italic; }

        .ar-card-actions {
          border-top: 1px solid var(--border);
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
          padding-top: .75rem;
        }

        /* ══════════════════════════════════════════════════
           BOTONES
        ══════════════════════════════════════════════════ */
        .ar-btn {
          align-items: center;
          border-radius: .4rem;
          cursor: pointer;
          display: inline-flex;
          font-size: .8125rem;
          font-weight: 600;
          gap: .3rem;
          padding: .4rem .875rem;
          transition: background .15s, color .15s, border-color .15s, opacity .15s;
          white-space: nowrap;
        }
        .ar-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ar-btn--sm { font-size: .75rem; padding: .3rem .625rem; }

        .ar-btn--export {
          background: var(--brand);
          border: 1px solid var(--brand);
          color: #fff;
        }
        .ar-btn--export:hover { background: var(--brand-hover); }

        .ar-btn--confirm {
          background: rgba(34,197,94,.12);
          border: 1px solid rgba(34,197,94,.3);
          color: #22c55e;
        }
        .ar-btn--confirm:hover:not(:disabled) {
          background: rgba(34,197,94,.22);
          border-color: #22c55e;
        }

        .ar-btn--complete {
          background: rgba(59,130,246,.12);
          border: 1px solid rgba(59,130,246,.3);
          color: #60a5fa;
        }
        .ar-btn--complete:hover:not(:disabled) {
          background: rgba(59,130,246,.22);
          border-color: #60a5fa;
        }

        .ar-btn--cancel {
          background: rgba(231,76,60,.1);
          border: 1px solid rgba(231,76,60,.3);
          color: var(--danger);
        }
        .ar-btn--cancel:hover:not(:disabled) {
          background: rgba(231,76,60,.2);
          border-color: var(--danger);
        }

        .ar-btn--ghost {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .ar-btn--ghost:hover:not(:disabled) { border-color: #555; color: #fff; }

        .ar-btn--danger {
          background: var(--danger);
          border: 1px solid var(--danger);
          color: #fff;
        }
        .ar-btn--danger:hover:not(:disabled) { background: #c0392b; }

        .ar-btn--page {
          background: var(--bg1);
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .ar-btn--page:hover:not(:disabled) { border-color: #555; color: #fff; }

        /* ── Paginación ── */
        .ar-pagination {
          align-items: center;
          display: flex;
          gap: .875rem;
          justify-content: center;
          padding: .25rem 0;
        }
        .ar-page-info {
          color: var(--text-muted);
          font-size: .875rem;
          font-variant-numeric: tabular-nums;
        }
        .ar-page-sub { font-size: .75rem; }

        /* ── Estado vacío ── */
        .ar-empty {
          align-items: center;
          color: var(--text-muted);
          display: flex;
          font-size: .875rem;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
        }

        /* ══════════════════════════════════════════════════
           SKELETON
        ══════════════════════════════════════════════════ */
        @keyframes ar-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .ar-skeleton-row td { border-top: 1px solid #1a1a1a; padding: .8rem 1rem; }
        .ar-sk-cell {
          background-image: linear-gradient(90deg, #181818 25%, #232323 50%, #181818 75%);
          background-size: 400px 100%;
          border-radius: 4px;
          height: 12px;
          animation: ar-shimmer 1.4s infinite linear;
          width: 70%;
        }
        .ar-skeleton-card {
          background-image: linear-gradient(90deg, #111 0%, #1a1a1a 50%, #111 100%);
          background-size: 400px 100%;
          animation: ar-shimmer 1.4s infinite linear;
          min-height: 120px;
        }
        .ar-sk-line {
          background-image: linear-gradient(90deg, #181818 25%, #232323 50%, #181818 75%);
          background-size: 400px 100%;
          border-radius: 4px;
          height: 12px;
          animation: ar-shimmer 1.4s infinite linear;
        }
        .ar-sk-short { width: 35%; }
        .ar-sk-long  { width: 90%; }
        .ar-sk-med   { width: 60%; }

        /* ══════════════════════════════════════════════════
           MODAL CANCELACIÓN (A-09)
        ══════════════════════════════════════════════════ */
        .ar-overlay {
          align-items: flex-end;
          backdrop-filter: blur(3px);
          background: rgba(0,0,0,.75);
          bottom: 0;
          display: flex;
          justify-content: center;
          left: 0;
          position: fixed;
          right: 0;
          top: 0;
          z-index: 500;
        }
        @media (min-width: 480px) { .ar-overlay { align-items: center; } }

        .ar-modal {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: 1rem 1rem 0 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 440px;
          padding: 2rem 1.5rem;
          width: 100%;
          animation: ar-slide-up .2s ease;
        }
        @media (min-width: 480px) {
          .ar-modal { border-radius: 1rem; animation: ar-fade-in .18s ease; }
        }
        @keyframes ar-slide-up {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes ar-fade-in {
          from { opacity: 0; transform: scale(.97); }
          to   { opacity: 1; transform: scale(1);   }
        }

        .ar-modal-icon  { font-size: 2rem; text-align: center; }
        .ar-modal-title {
          color: #fff;
          font-size: 1.0625rem;
          font-weight: 700;
          margin: 0;
          text-align: center;
        }
        .ar-modal-desc {
          color: var(--text-muted);
          font-size: .875rem;
          margin: -.25rem 0 0;
          text-align: center;
        }

        .ar-modal-booking {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: .625rem;
          display: flex;
          flex-direction: column;
          gap: .5rem;
          padding: 1rem;
        }
        .ar-modal-row {
          display: flex;
          font-size: .875rem;
          gap: .5rem;
          justify-content: space-between;
        }
        .ar-modal-label { color: var(--text-muted); }
        .ar-modal-value { color: #fff; font-weight: 500; text-align: right; }

        .ar-modal-actions {
          display: flex;
          gap: .625rem;
          justify-content: flex-end;
          margin-top: .25rem;
        }
      `}</style>
    </div>
  );
}
