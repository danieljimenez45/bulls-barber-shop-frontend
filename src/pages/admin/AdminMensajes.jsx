/**
 * AdminMensajes.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Panel de gestión de mensajes del formulario de contacto.
 *
 * Funcionalidades:
 *  - Barra de métricas: total, no leídos, leídos
 *  - Filtro: Todos / No leídos / Leídos
 *  - Lista de tarjetas con nombre, email, teléfono, asunto, mensaje y fecha
 *  - Badge "Nuevo" en mensajes no leídos
 *  - Botón "Marcar como leído" con actualización optimista
 *  - Texto del mensaje expandible si es largo
 *  - Skeleton animado durante la carga inicial
 *  - Estado vacío y estado de error con reintento
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { listContactMessages, markMessageRead } from "../../services/adminApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Formatea una fecha ISO en texto legible. */
function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day:    "numeric",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

/** Esqueleto animado de una tarjeta. */
function MessageSkeleton() {
  return (
    <div className="ms-skeleton">
      <div className="ms-sk-line ms-sk-short" />
      <div className="ms-sk-line ms-sk-long"  />
      <div className="ms-sk-line ms-sk-med"   />
      <div className="ms-sk-line ms-sk-long"  />
    </div>
  );
}

/**
 * Tarjeta individual de un mensaje de contacto.
 * Permite expandir/contraer el cuerpo del mensaje si supera 200 caracteres.
 */
function MessageCard({ message, onMarkRead }) {
  const [expanded,     setExpanded]     = useState(false);
  const [loadingRead,  setLoadingRead]  = useState(false);

  const TRUNCATE_AT = 200;
  const isLong      = (message.mensaje?.length ?? 0) > TRUNCATE_AT;
  const bodyText    = isLong && !expanded
    ? message.mensaje.slice(0, TRUNCATE_AT) + "…"
    : message.mensaje;

  const handleMarkRead = async () => {
    setLoadingRead(true);
    try {
      await onMarkRead(message.id);
    } finally {
      setLoadingRead(false);
    }
  };

  return (
    <article className={`ms-card ${!message.leido ? "ms-card--unread" : ""}`}>

      {/* ── Cabecera ── */}
      <div className="ms-card-header">
        <div className="ms-card-who">
          <span className="ms-card-name">{message.nombre}</span>
          {!message.leido && (
            <span className="ms-badge-new" aria-label="Mensaje nuevo">Nuevo</span>
          )}
        </div>
        <span className="ms-card-date">{formatDate(message.created_at)}</span>
      </div>

      {/* ── Contacto ── */}
      <div className="ms-card-contact">
        <a href={`mailto:${message.email}`} className="ms-contact-link">
          ✉️ {message.email}
        </a>
        {message.telefono && (
          <a href={`tel:${message.telefono}`} className="ms-contact-link">
            📞 {message.telefono}
          </a>
        )}
      </div>

      {/* ── Asunto ── */}
      {message.asunto && (
        <p className="ms-card-subject">
          <span className="ms-subject-label">Asunto:</span> {message.asunto}
        </p>
      )}

      {/* ── Cuerpo del mensaje ── */}
      <div className="ms-card-body">
        <p className="ms-card-text">{bodyText}</p>
        {isLong && (
          <button
            className="ms-expand-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Ver menos ▲" : "Ver más ▼"}
          </button>
        )}
      </div>

      {/* ── Acciones ── */}
      {!message.leido && (
        <div className="ms-card-actions">
          <button
            className="ms-btn ms-btn--primary"
            onClick={handleMarkRead}
            disabled={loadingRead}
            aria-busy={loadingRead}
          >
            {loadingRead ? "…" : "✓ Marcar como leído"}
          </button>
        </div>
      )}
    </article>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

const FILTROS = [
  { key: "todos",     label: "Todos"     },
  { key: "no_leidos", label: "No leídos" },
  { key: "leidos",    label: "Leídos"    },
];

export default function AdminMensajes() {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filtro,   setFiltro]   = useState("todos");

  // ── Carga ─────────────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listContactMessages({ size: 100 });
      setMessages(data.items ?? []);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "No se pudieron cargar los mensajes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  const handleMarkRead = useCallback(async (id) => {
    // Optimistic UI: actualizar localmente antes de la llamada
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, leido: true } : m)),
    );
    try {
      await markMessageRead(id);
      toast.success("Mensaje marcado como leído");
    } catch {
      // Revertir si falla
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, leido: false } : m)),
      );
      toast.error("No se pudo marcar el mensaje");
    }
  }, []);

  // ── Métricas y filtrado ───────────────────────────────────────────────────

  const noLeidos  = useMemo(() => messages.filter((m) => !m.leido).length, [messages]);
  const leidos    = useMemo(() => messages.filter((m) =>  m.leido).length, [messages]);

  const filtrados = useMemo(() => {
    if (filtro === "no_leidos") return messages.filter((m) => !m.leido);
    if (filtro === "leidos")    return messages.filter((m) =>  m.leido);
    return messages;
  }, [messages, filtro]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="ms-page">

      {/* ── Métricas ──────────────────────────────────────────────────── */}
      <div className="ms-stats">
        <div className="ms-stat">
          <span className="ms-stat-value">{messages.length}</span>
          <span className="ms-stat-label">Total</span>
        </div>
        <div className={`ms-stat ${noLeidos > 0 ? "ms-stat--accent" : ""}`}>
          <span className="ms-stat-value">{noLeidos}</span>
          <span className="ms-stat-label">No leídos</span>
        </div>
        <div className="ms-stat">
          <span className="ms-stat-value">{leidos}</span>
          <span className="ms-stat-label">Leídos</span>
        </div>
      </div>

      {/* ── Filtros ────────────────────────────────────────────────────── */}
      <div className="ms-filters" role="group" aria-label="Filtrar mensajes">
        {FILTROS.map(({ key, label }) => {
          const count =
            key === "todos"     ? messages.length :
            key === "no_leidos" ? noLeidos :
                                  leidos;
          return (
            <button
              key={key}
              className={`ms-filter-btn ${filtro === key ? "ms-filter-btn--active" : ""}`}
              onClick={() => setFiltro(key)}
            >
              {label}
              <span className="ms-filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Contenido ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="ms-list">
          {Array.from({ length: 5 }, (_, i) => <MessageSkeleton key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="ms-error">
          <p>⚠️ {error}</p>
          <button className="ms-btn ms-btn--primary" onClick={fetchMessages}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && filtrados.length === 0 && (
        <div className="ms-empty">
          <p className="ms-empty-icon">✉️</p>
          <p>
            {messages.length === 0
              ? "Aún no hay mensajes de contacto."
              : `No hay mensajes ${filtro === "no_leidos" ? "sin leer" : "leídos"}.`}
          </p>
        </div>
      )}

      {!loading && !error && filtrados.length > 0 && (
        <div className="ms-list">
          {filtrados.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {/* ── Estilos ──────────────────────────────────────────────────── */}
      <style>{`
        .ms-page {
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
          gap: 1.5rem;
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Métricas ── */
        .ms-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .75rem;
        }
        .ms-stat {
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
        .ms-stat--accent {
          border-color: rgba(204, 32, 32, .35);
          background: var(--brand-dim);
        }
        .ms-stat-value {
          color: #fff;
          font-size: 1.75rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .ms-stat--accent .ms-stat-value { color: var(--brand); }
        .ms-stat-label {
          color: var(--text-muted);
          font-size: .6875rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        /* ── Filtros ── */
        .ms-filters {
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
        }
        .ms-filter-btn {
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
        .ms-filter-btn:hover { color: #fff; border-color: #444; }
        .ms-filter-btn--active {
          background: var(--brand-dim);
          border-color: var(--brand);
          color: var(--brand);
          font-weight: 700;
        }
        .ms-filter-count {
          background: rgba(255,255,255,.08);
          border-radius: 999px;
          font-size: .6875rem;
          padding: .1rem .4rem;
        }
        .ms-filter-btn--active .ms-filter-count {
          background: rgba(204, 32, 32, .2);
        }

        /* ── Lista ── */
        .ms-list {
          display: flex;
          flex-direction: column;
          gap: .75rem;
        }

        /* ── Tarjeta ── */
        .ms-card {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          gap: .625rem;
          padding: 1.25rem;
          transition: border-color .2s;
        }
        .ms-card:hover { border-color: #3a3a3a; }
        .ms-card--unread {
          border-left: 3px solid var(--brand);
        }

        /* Cabecera */
        .ms-card-header {
          align-items: flex-start;
          display: flex;
          justify-content: space-between;
          gap: .5rem;
          flex-wrap: wrap;
        }
        .ms-card-who {
          align-items: center;
          display: flex;
          gap: .5rem;
          flex-wrap: wrap;
        }
        .ms-card-name {
          color: #fff;
          font-size: .9375rem;
          font-weight: 700;
        }
        .ms-badge-new {
          background: var(--brand);
          border-radius: 999px;
          color: #fff;
          font-size: .625rem;
          font-weight: 800;
          letter-spacing: .06em;
          padding: .2rem .55rem;
          text-transform: uppercase;
        }
        .ms-card-date {
          color: var(--text-muted);
          font-size: .75rem;
          flex-shrink: 0;
        }

        /* Contacto */
        .ms-card-contact {
          display: flex;
          flex-wrap: wrap;
          gap: .75rem;
        }
        .ms-contact-link {
          color: var(--text-muted);
          font-size: .8125rem;
          text-decoration: none;
          transition: color .15s;
        }
        .ms-contact-link:hover { color: var(--brand); }

        /* Asunto */
        .ms-card-subject {
          color: var(--text-muted);
          font-size: .8125rem;
          margin: 0;
        }
        .ms-subject-label {
          color: #ccc;
          font-weight: 600;
        }

        /* Cuerpo */
        .ms-card-body { display: flex; flex-direction: column; gap: .375rem; }
        .ms-card-text {
          color: var(--text);
          font-size: .875rem;
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .ms-expand-btn {
          background: none;
          border: none;
          color: var(--brand);
          cursor: pointer;
          font-size: .8125rem;
          font-weight: 600;
          padding: 0;
          text-align: left;
          width: fit-content;
        }
        .ms-expand-btn:hover { text-decoration: underline; }

        /* Acciones */
        .ms-card-actions {
          margin-top: .25rem;
        }

        /* ── Botones ── */
        .ms-btn {
          align-items: center;
          border-radius: .4rem;
          cursor: pointer;
          display: inline-flex;
          font-size: .8125rem;
          font-weight: 600;
          gap: .3rem;
          padding: .4rem .875rem;
          transition: background .15s, opacity .15s;
        }
        .ms-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ms-btn--primary {
          background: var(--brand);
          border: 1px solid var(--brand);
          color: #fff;
        }
        .ms-btn--primary:hover:not(:disabled) { background: #a81a1a; }

        /* ── Skeleton ── */
        @keyframes ms-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .ms-skeleton {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          gap: .625rem;
          padding: 1.25rem;
        }
        .ms-sk-line {
          background-image: linear-gradient(90deg, #181818 25%, #222 50%, #181818 75%);
          background-size: 400px 100%;
          border-radius: 4px;
          animation: ms-shimmer 1.4s infinite linear;
          height: 12px;
        }
        .ms-sk-short { width: 30%; }
        .ms-sk-long  { width: 90%; }
        .ms-sk-med   { width: 60%; }

        /* ── Error / Vacío ── */
        .ms-error, .ms-empty {
          align-items: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 3rem 1rem;
          text-align: center;
        }
        .ms-empty-icon { font-size: 2.5rem; margin: 0; }
      `}</style>
    </div>
  );
}
