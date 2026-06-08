/**
 * AdminResenas.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Panel de gestión de reseñas de clientes.
 *
 * Funcionalidades:
 *  - Barra de métricas: total, media (con estrellas), nº visibles
 *  - Lista de reseñas con filtro (todas / visibles / ocultas)
 *  - Toggle de visibilidad con feedback inmediato (optimistic UI)
 *  - Eliminación con confirmación inline por tarjeta
 *  - Skeleton animado durante la carga inicial
 *  - Estado vacío y estado de error con reintento
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  listAdminReviews,
  toggleReviewVisibility,
  deleteReview,
} from "../../api/reviews";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Renderiza N estrellas llenas y el resto vacías (0–5). */
function Stars({ value, size = "1rem" }) {
  return (
    <span className="re-stars" style={{ fontSize: size }} aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < value ? "#f39c12" : "#333" }}>★</span>
      ))}
    </span>
  );
}

/** Formatea una fecha ISO en texto legible. */
function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

/** Esqueleto animado de una tarjeta de reseña. */
function ReviewSkeleton() {
  return (
    <div className="re-skeleton">
      <div className="re-sk-line re-sk-short" />
      <div className="re-sk-line re-sk-long"  />
      <div className="re-sk-line re-sk-med"   />
    </div>
  );
}

/**
 * Tarjeta individual de una reseña.
 * Gestiona su propio estado de "confirmar eliminación" para no
 * necesitar un modal global.
 */
function ReviewCard({ review, onToggle, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingToggle, setLoadingToggle]  = useState(false);
  const [loadingDelete, setLoadingDelete]  = useState(false);

  const handleToggle = async () => {
    setLoadingToggle(true);
    try {
      await onToggle(review.id, !review.visible);
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleDelete = async () => {
    setLoadingDelete(true);
    try {
      await onDelete(review.id);
    } finally {
      setLoadingDelete(false);
      setConfirmDelete(false);
    }
  };

  return (
    <article className={`re-card ${!review.visible ? "re-card--hidden" : ""}`}>
      {/* Cabecera: nombre + valoración + fecha */}
      <div className="re-card-header">
        <div className="re-card-meta">
          <span className="re-card-name">{review.nombre}</span>
          <Stars value={review.valoracion} />
        </div>
        <div className="re-card-right">
          <span className="re-card-date">{formatDate(review.created_at)}</span>
          <span
            className={`re-badge ${review.visible ? "re-badge--visible" : "re-badge--hidden"}`}
          >
            {review.visible ? "Visible" : "Oculta"}
          </span>
        </div>
      </div>

      {/* Comentario */}
      {review.comentario && (
        <p className="re-card-comment">"{review.comentario}"</p>
      )}

      {/* Acciones */}
      <div className="re-card-actions">
        {/* Toggle visibilidad */}
        <button
          className="re-btn re-btn--ghost"
          onClick={handleToggle}
          disabled={loadingToggle}
          aria-label={review.visible ? "Ocultar reseña" : "Mostrar reseña"}
        >
          {loadingToggle ? "…" : review.visible ? "👁️ Ocultar" : "👁️‍🗨️ Mostrar"}
        </button>

        {/* Eliminar — con confirmación inline */}
        {confirmDelete ? (
          <div className="re-confirm">
            <span className="re-confirm-text">¿Eliminar?</span>
            <button
              className="re-btn re-btn--danger"
              onClick={handleDelete}
              disabled={loadingDelete}
            >
              {loadingDelete ? "…" : "Sí, borrar"}
            </button>
            <button
              className="re-btn re-btn--ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={loadingDelete}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            className="re-btn re-btn--ghost re-btn--danger-ghost"
            onClick={() => setConfirmDelete(true)}
            aria-label="Eliminar reseña"
          >
            🗑️ Eliminar
          </button>
        )}
      </div>
    </article>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

/** Opciones del filtro de visibilidad */
const FILTROS = [
  { key: "todas",    label: "Todas"   },
  { key: "visibles", label: "Visibles" },
  { key: "ocultas",  label: "Ocultas"  },
];

export default function AdminResenas() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filtro,  setFiltro]  = useState("todas");

  // ── Carga inicial ────────────────────────────────────────────────────────

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listAdminReviews({ size: 100 });
      // La respuesta es PagedResponse → items
      setReviews(data.items ?? data);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "No se pudieron cargar las reseñas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── Acciones ─────────────────────────────────────────────────────────────

  /** Actualiza visibilidad en local sin recargar toda la lista (optimistic UI). */
  const handleToggle = useCallback(async (id, visible) => {
    // Aplicar cambio local inmediatamente
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, visible } : r)),
    );
    try {
      await toggleReviewVisibility(id, visible);
      toast.success(visible ? "Reseña publicada" : "Reseña ocultada");
    } catch {
      // Revertir si falla
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, visible: !visible } : r)),
      );
      toast.error("No se pudo cambiar la visibilidad");
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Reseña eliminada");
    } catch {
      toast.error("No se pudo eliminar la reseña");
      throw new Error("delete_failed"); // para que la tarjeta sepa que falló
    }
  }, []);

  // ── Métricas derivadas ───────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!reviews.length) return { total: 0, media: 0, visibles: 0 };
    const total    = reviews.length;
    const visibles = reviews.filter((r) => r.visible).length;
    const media    = reviews.reduce((s, r) => s + r.valoracion, 0) / total;
    return { total, media, visibles };
  }, [reviews]);

  // ── Lista filtrada ───────────────────────────────────────────────────────

  const filtradas = useMemo(() => {
    if (filtro === "visibles") return reviews.filter((r) =>  r.visible);
    if (filtro === "ocultas")  return reviews.filter((r) => !r.visible);
    return reviews;
  }, [reviews, filtro]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="re-page">

      {/* ── Métricas ──────────────────────────────────────────────────── */}
      <div className="re-stats">
        <div className="re-stat">
          <span className="re-stat-value">{stats.total}</span>
          <span className="re-stat-label">Total</span>
        </div>
        <div className="re-stat re-stat--accent">
          <span className="re-stat-value">
            {stats.media > 0 ? stats.media.toFixed(1) : "—"}
          </span>
          <span className="re-stat-label">Media ★</span>
        </div>
        <div className="re-stat">
          <span className="re-stat-value">{stats.visibles}</span>
          <span className="re-stat-label">Visibles</span>
        </div>
        <div className="re-stat">
          <span className="re-stat-value">{stats.total - stats.visibles}</span>
          <span className="re-stat-label">Ocultas</span>
        </div>
      </div>

      {/* ── Filtros ────────────────────────────────────────────────────── */}
      <div className="re-filters" role="group" aria-label="Filtrar reseñas">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            className={`re-filter-btn ${filtro === key ? "re-filter-btn--active" : ""}`}
            onClick={() => setFiltro(key)}
          >
            {label}
            {key === "todas"    && <span className="re-filter-count">{reviews.length}</span>}
            {key === "visibles" && <span className="re-filter-count">{stats.visibles}</span>}
            {key === "ocultas"  && <span className="re-filter-count">{stats.total - stats.visibles}</span>}
          </button>
        ))}
      </div>

      {/* ── Contenido principal ───────────────────────────────────────── */}
      {loading && (
        <div className="re-list">
          {Array.from({ length: 6 }, (_, i) => <ReviewSkeleton key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="re-error">
          <p>⚠️ {error}</p>
          <button className="re-btn re-btn--primary" onClick={fetchReviews}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && filtradas.length === 0 && (
        <div className="re-empty">
          <p className="re-empty-icon">⭐</p>
          <p>
            {filtro === "todas"
              ? "Aún no hay reseñas."
              : `No hay reseñas ${filtro}.`}
          </p>
        </div>
      )}

      {!loading && !error && filtradas.length > 0 && (
        <div className="re-list">
          {filtradas.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Estilos ──────────────────────────────────────────────────── */}
      <style>{`
        .re-page {
          --brand:      #CC2020;
          --brand-dim:  rgba(204, 32, 32, .12);
          --bg1:        #111111;
          --bg2:        #181818;
          --border:     #2c2c2c;
          --text:       #f0f0f0;
          --text-muted: #888888;
          --danger:     #e74c3c;

          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Métricas ── */
        .re-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: .75rem;
        }
        @media (max-width: 480px) {
          .re-stats { grid-template-columns: repeat(2, 1fr); }
        }
        .re-stat {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .25rem;
          padding: 1rem;
          text-align: center;
        }
        .re-stat--accent {
          border-color: rgba(204, 32, 32, .3);
          background: var(--brand-dim);
        }
        .re-stat-value {
          color: #fff;
          font-size: 1.75rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .re-stat--accent .re-stat-value { color: var(--brand); }
        .re-stat-label {
          color: var(--text-muted);
          font-size: .6875rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        /* ── Filtros ── */
        .re-filters {
          display: flex;
          gap: .5rem;
          flex-wrap: wrap;
        }
        .re-filter-btn {
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
          padding: .375rem .875rem;
          transition: color .15s, border-color .15s, background .15s;
        }
        .re-filter-btn:hover { color: #fff; border-color: #444; }
        .re-filter-btn--active {
          background: var(--brand-dim);
          border-color: var(--brand);
          color: var(--brand);
          font-weight: 700;
        }
        .re-filter-count {
          background: rgba(255,255,255,.08);
          border-radius: 999px;
          font-size: .6875rem;
          padding: .1rem .4rem;
        }
        .re-filter-btn--active .re-filter-count {
          background: rgba(204, 32, 32, .2);
        }

        /* ── Lista ── */
        .re-list {
          display: flex;
          flex-direction: column;
          gap: .75rem;
        }

        /* ── Tarjeta de reseña ── */
        .re-card {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          gap: .625rem;
          padding: 1.25rem;
          transition: border-color .2s;
        }
        .re-card--hidden {
          opacity: .55;
          border-style: dashed;
        }
        .re-card:hover { border-color: #444; }

        .re-card-header {
          align-items: flex-start;
          display: flex;
          gap: .75rem;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .re-card-meta {
          display: flex;
          flex-direction: column;
          gap: .25rem;
        }
        .re-card-name {
          color: #fff;
          font-size: .9375rem;
          font-weight: 700;
        }
        .re-stars { display: inline-flex; gap: .1rem; line-height: 1; }

        .re-card-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: .375rem;
          flex-shrink: 0;
        }
        .re-card-date {
          color: var(--text-muted);
          font-size: .75rem;
        }
        .re-badge {
          border-radius: 999px;
          font-size: .6875rem;
          font-weight: 700;
          padding: .2rem .6rem;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .re-badge--visible {
          background: rgba(46, 204, 113, .12);
          color: #2ecc71;
        }
        .re-badge--hidden {
          background: rgba(136,136,136,.12);
          color: #888;
        }

        .re-card-comment {
          color: var(--text-muted);
          font-size: .875rem;
          font-style: italic;
          line-height: 1.55;
          margin: 0;
          border-left: 2px solid var(--border);
          padding-left: .75rem;
        }

        /* ── Acciones de tarjeta ── */
        .re-card-actions {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
          margin-top: .25rem;
        }

        /* ── Botones ── */
        .re-btn {
          align-items: center;
          border-radius: .4rem;
          cursor: pointer;
          display: inline-flex;
          font-size: .8125rem;
          font-weight: 600;
          gap: .3rem;
          padding: .375rem .75rem;
          transition: background .15s, color .15s, border-color .15s, opacity .15s;
        }
        .re-btn:disabled { opacity: .5; cursor: not-allowed; }

        .re-btn--primary {
          background: var(--brand);
          border: 1px solid var(--brand);
          color: #fff;
        }
        .re-btn--primary:hover:not(:disabled) { background: #a81a1a; }

        .re-btn--ghost {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .re-btn--ghost:hover:not(:disabled) { border-color: #555; color: #fff; }

        .re-btn--danger {
          background: var(--danger);
          border: 1px solid var(--danger);
          color: #fff;
        }
        .re-btn--danger:hover:not(:disabled) { background: #c0392b; }

        .re-btn--danger-ghost {
          border-color: transparent;
        }
        .re-btn--danger-ghost:hover:not(:disabled) {
          border-color: var(--danger);
          color: var(--danger);
        }

        /* Confirmación inline */
        .re-confirm {
          align-items: center;
          display: flex;
          gap: .375rem;
          flex-wrap: wrap;
        }
        .re-confirm-text {
          color: var(--danger);
          font-size: .8125rem;
          font-weight: 600;
        }

        /* ── Skeleton ── */
        @keyframes re-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .re-skeleton {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          gap: .625rem;
          padding: 1.25rem;
        }
        .re-sk-line {
          background-image: linear-gradient(90deg, #181818 25%, #222 50%, #181818 75%);
          background-size: 400px 100%;
          border-radius: 4px;
          animation: re-shimmer 1.4s infinite linear;
          height: 12px;
        }
        .re-sk-short { width: 35%; }
        .re-sk-long  { width: 90%; }
        .re-sk-med   { width: 65%; }

        /* ── Error / Vacío ── */
        .re-error {
          align-items: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 3rem 1rem;
          text-align: center;
        }
        .re-empty {
          align-items: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: .5rem;
          padding: 3rem 1rem;
          text-align: center;
        }
        .re-empty-icon { font-size: 2.5rem; margin: 0; }
      `}</style>
    </div>
  );
}
