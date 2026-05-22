/**
 * AdminReservas.jsx
 * Página de gestión de reservas del panel de administración.
 *
 * Funcionalidades:
 *  - Listado paginado de reservas (filtrable por estado)
 *  - Actualización de estado (confirmada / completada / cancelada)
 *  - Botón "Exportar CSV" → abre ExportCSVModal con selector de rango de fechas
 */

import { useState, useEffect, useCallback } from "react";
import { listBookings, updateBooking, cancelBooking } from "../../services/adminApi";
import ExportCSVModal from "../../components/admin/ExportCSVModal";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADOS = ["", "pendiente", "confirmada", "completada", "cancelada"];

const ESTADO_LABELS = {
  pendiente:  { label: "Pendiente",   cls: "badge--warning"  },
  confirmada: { label: "Confirmada",  cls: "badge--success"  },
  completada: { label: "Completada",  cls: "badge--info"     },
  cancelada:  { label: "Cancelada",   cls: "badge--neutral"  },
};

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AdminReservas() {
  // Estado de datos
  const [bookings, setBookings] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");

  // UI
  const [showExport, setShowExport]           = useState(false);
  const [updatingId, setUpdatingId]           = useState(null);

  const PAGE_SIZE = 20;

  // ── Carga de datos ────────────────────────────────────────────────────────

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listBookings({
        page,
        size: PAGE_SIZE,
        ...(filtroEstado ? { estado: filtroEstado } : {}),
      });
      setBookings(data.items);
      setTotal(data.total);
    } catch {
      toast.error("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  }, [page, filtroEstado]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Resetea a página 1 al cambiar el filtro
  const handleFiltroChange = (e) => {
    setFiltroEstado(e.target.value);
    setPage(1);
  };

  // ── Acciones ──────────────────────────────────────────────────────────────

  const handleEstadoChange = async (booking, nuevoEstado) => {
    if (nuevoEstado === booking.estado) return;
    setUpdatingId(booking.id);
    try {
      if (nuevoEstado === "cancelada") {
        await cancelBooking(booking.id);
      } else {
        await updateBooking(booking.id, { estado: nuevoEstado });
      }
      toast.success(`Reserva #${booking.id} → ${nuevoEstado}`);
      fetchBookings();
    } catch {
      toast.error("No se pudo actualizar la reserva");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Paginación ────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="ar-page">
      {/* ── Cabecera ──────────────────────────────────────────────────────── */}
      <div className="ar-header">
        <div className="ar-header__left">
          <h1 className="ar-title">Reservas</h1>
          <span className="ar-count">{total} en total</span>
        </div>
        <div className="ar-header__right">
          {/* Filtro por estado */}
          <select
            className="ar-filter"
            value={filtroEstado}
            onChange={handleFiltroChange}
            aria-label="Filtrar por estado"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e ? ESTADO_LABELS[e]?.label : "Todos los estados"}
              </option>
            ))}
          </select>

          {/* Botón de exportación — núcleo de B-21 */}
          <button
            className="ar-btn ar-btn--export"
            onClick={() => setShowExport(true)}
            aria-label="Exportar reservas a CSV"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="ar-table-wrap">
        {loading ? (
          <div className="ar-empty">Cargando reservas…</div>
        ) : bookings.length === 0 ? (
          <div className="ar-empty">No hay reservas{filtroEstado ? ` con estado "${filtroEstado}"` : ""}.</div>
        ) : (
          <table className="ar-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Servicio</th>
                <th>Fecha y hora</th>
                <th>Estado</th>
                <th>Cambiar estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const badge = ESTADO_LABELS[b.estado] ?? { label: b.estado, cls: "" };
                return (
                  <tr key={b.id} className={updatingId === b.id ? "ar-row--updating" : ""}>
                    <td className="ar-id">{b.id}</td>
                    <td>
                      <span className="ar-cliente">{b.nombre_cliente}</span>
                      {b.email && <span className="ar-email">{b.email}</span>}
                    </td>
                    <td>{b.telefono}</td>
                    <td>{b.servicio_nombre || `Servicio #${b.servicio_id}`}</td>
                    <td className="ar-fecha">{formatDateTime(b.fecha_hora)}</td>
                    <td>
                      <span className={`ar-badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td>
                      <select
                        className="ar-estado-select"
                        value={b.estado}
                        onChange={(e) => handleEstadoChange(b, e.target.value)}
                        disabled={updatingId === b.id}
                        aria-label={`Cambiar estado de reserva ${b.id}`}
                      >
                        {ESTADOS.filter(Boolean).map((e) => (
                          <option key={e} value={e}>{ESTADO_LABELS[e]?.label ?? e}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Paginación ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="ar-pagination">
          <button
            className="ar-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            aria-label="Página anterior"
          >
            ← Anterior
          </button>
          <span className="ar-page-info">Página {page} de {totalPages}</span>
          <button
            className="ar-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            aria-label="Página siguiente"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* ── Modal de exportación ──────────────────────────────────────────── */}
      {showExport && <ExportCSVModal onClose={() => setShowExport(false)} />}

      {/* ── Estilos ───────────────────────────────────────────────────────── */}
      <style>{`
        .ar-page { padding: 2rem; min-height: 100vh; color: #fff; }

        /* Cabecera */
        .ar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .ar-header__left { display: flex; align-items: baseline; gap: .75rem; }
        .ar-title { font-size: 1.5rem; font-weight: 700; margin: 0; color: #fff; }
        .ar-count { color: #666; font-size: .875rem; }
        .ar-header__right { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }

        /* Filtro */
        .ar-filter {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: .5rem;
          color: #ccc;
          font-size: .875rem;
          padding: .5rem .875rem;
          outline: none;
          cursor: pointer;
        }
        .ar-filter:focus { border-color: #CC2020; }

        /* Botón exportar */
        .ar-btn--export {
          background: #CC2020;
          border: none;
          border-radius: .5rem;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: .4rem;
          font-size: .875rem;
          font-weight: 600;
          padding: .5rem 1rem;
          transition: background .2s;
        }
        .ar-btn--export:hover { background: #a81a1a; }

        /* Tabla */
        .ar-table-wrap {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: .75rem;
          overflow-x: auto;
        }
        .ar-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
        .ar-table th {
          background: #111;
          color: #888;
          font-size: .75rem;
          font-weight: 600;
          letter-spacing: .05em;
          padding: .875rem 1rem;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .ar-table td {
          border-top: 1px solid #222;
          color: #ddd;
          padding: .875rem 1rem;
          vertical-align: middle;
        }
        .ar-row--updating { opacity: .5; pointer-events: none; }
        .ar-id { color: #666; font-size: .8rem; font-variant-numeric: tabular-nums; }
        .ar-cliente { display: block; color: #fff; font-weight: 500; }
        .ar-email { display: block; color: #666; font-size: .8rem; margin-top: .125rem; }
        .ar-fecha { white-space: nowrap; font-variant-numeric: tabular-nums; }

        /* Badges */
        .ar-badge {
          border-radius: 999px;
          font-size: .75rem;
          font-weight: 600;
          padding: .25rem .625rem;
          white-space: nowrap;
        }
        .badge--warning  { background: rgba(234,179,8,.15);   color: #eab308; }
        .badge--success  { background: rgba(34,197,94,.15);   color: #22c55e; }
        .badge--info     { background: rgba(59,130,246,.15);  color: #60a5fa; }
        .badge--neutral  { background: rgba(100,100,100,.15); color: #888;    }

        /* Select de estado inline */
        .ar-estado-select {
          background: #0f0f0f;
          border: 1px solid #333;
          border-radius: .375rem;
          color: #ccc;
          font-size: .8rem;
          padding: .375rem .625rem;
          outline: none;
          cursor: pointer;
        }
        .ar-estado-select:focus { border-color: #CC2020; }

        /* Vacío */
        .ar-empty {
          padding: 3rem;
          text-align: center;
          color: #555;
          font-size: .9rem;
        }

        /* Paginación */
        .ar-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.25rem;
        }
        .ar-page-btn {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: .5rem;
          color: #ccc;
          cursor: pointer;
          font-size: .875rem;
          padding: .5rem 1rem;
          transition: background .15s, color .15s;
        }
        .ar-page-btn:hover:not(:disabled) { background: #2a2a2a; color: #fff; }
        .ar-page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .ar-page-info { color: #666; font-size: .875rem; }
      `}</style>
    </div>
  );
}
