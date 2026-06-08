/**
 * AdminServicios.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Panel CRUD de servicios del negocio.
 *
 * Funcionalidades:
 *  - Lista agrupada por categoría, ordenada por campo "orden"
 *  - Toggle activo/inactivo directamente desde la tarjeta
 *  - Edición mediante modal con formulario completo
 *  - Creación de nuevo servicio vía botón FAB (+)
 *  - Eliminación con confirmación inline
 *  - Skeleton animado durante la carga inicial
 *  - Estados: cargando / vacío / error con reintento
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  listAdminServices,
  createService,
  updateService,
  deleteService,
} from "../../api/services";

// ── Constantes ────────────────────────────────────────────────────────────────

/** Categorías conocidas — para el select del formulario y el agrupado. */
const CATEGORIAS = ["corte", "barba", "combo", "tratamiento", "otro"];

/** Formulario vacío para crear un nuevo servicio. */
const EMPTY_FORM = {
  nombre:           "",
  descripcion:      "",
  precio:           "",
  duracion_minutos: "30",
  categoria:        "corte",
  imagen_url:       "",
  activo:           true,
  orden:            "0",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Capitaliza la primera letra de un string. */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Formatea un precio en euros. */
const formatEur = (n) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Agrupa un array de servicios por su campo "categoria".
 * Devuelve un Map con orden de inserción según CATEGORIAS.
 */
function agruparPorCategoria(services) {
  const map = new Map();
  // Orden preferido según la constante
  CATEGORIAS.forEach((cat) => {
    const items = services.filter((s) => s.categoria === cat);
    if (items.length) map.set(cat, items);
  });
  // Categorías no contempladas en CATEGORIAS (datos inesperados)
  services.forEach((s) => {
    if (!map.has(s.categoria)) {
      map.set(s.categoria, services.filter((x) => x.categoria === s.categoria));
    }
  });
  return map;
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

/** Esqueleto animado de una tarjeta de servicio. */
function ServiceSkeleton() {
  return (
    <div className="sv-skeleton">
      <div className="sv-sk-line sv-sk-short" />
      <div className="sv-sk-line sv-sk-long"  />
      <div className="sv-sk-line sv-sk-med"   />
    </div>
  );
}

/**
 * Tarjeta individual de un servicio.
 * Estado de confirmación de eliminación gestionado localmente.
 */
function ServiceCard({ service, onEdit, onToggleActivo, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingToggle, setLoadingToggle]  = useState(false);
  const [loadingDelete, setLoadingDelete]  = useState(false);

  const handleToggle = async () => {
    setLoadingToggle(true);
    try {
      await onToggleActivo(service.id, !service.activo);
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleDelete = async () => {
    setLoadingDelete(true);
    try {
      await onDelete(service.id);
    } finally {
      setLoadingDelete(false);
      setConfirmDelete(false);
    }
  };

  return (
    <article className={`sv-card ${!service.activo ? "sv-card--inactive" : ""}`}>
      <div className="sv-card-top">
        <div className="sv-card-info">
          <span className="sv-card-name">{service.nombre}</span>
          {service.descripcion && (
            <span className="sv-card-desc">{service.descripcion}</span>
          )}
        </div>
        <div className="sv-card-price-wrap">
          <span className="sv-card-price">{formatEur(service.precio)}</span>
          <span className="sv-card-duration">{service.duracion_minutos} min</span>
        </div>
      </div>

      <div className="sv-card-bottom">
        <span
          className={`sv-badge ${service.activo ? "sv-badge--active" : "sv-badge--inactive"}`}
        >
          {service.activo ? "Activo" : "Inactivo"}
        </span>

        {/* Acciones */}
        <div className="sv-card-actions">
          {/* Toggle activo */}
          <button
            className="sv-btn sv-btn--ghost"
            onClick={handleToggle}
            disabled={loadingToggle}
            aria-label={service.activo ? "Desactivar servicio" : "Activar servicio"}
          >
            {loadingToggle ? "…" : service.activo ? "Desactivar" : "Activar"}
          </button>

          {/* Editar */}
          <button
            className="sv-btn sv-btn--ghost"
            onClick={() => onEdit(service)}
            aria-label="Editar servicio"
          >
            ✏️ Editar
          </button>

          {/* Eliminar con confirmación inline */}
          {confirmDelete ? (
            <div className="sv-confirm">
              <span className="sv-confirm-text">¿Eliminar?</span>
              <button
                className="sv-btn sv-btn--danger"
                onClick={handleDelete}
                disabled={loadingDelete}
              >
                {loadingDelete ? "…" : "Sí"}
              </button>
              <button
                className="sv-btn sv-btn--ghost"
                onClick={() => setConfirmDelete(false)}
                disabled={loadingDelete}
              >
                No
              </button>
            </div>
          ) : (
            <button
              className="sv-btn sv-btn--ghost sv-btn--danger-ghost"
              onClick={() => setConfirmDelete(true)}
              aria-label="Eliminar servicio"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Modal de formulario — sirve tanto para crear como para editar.
 * Se cierra pulsando Escape o el fondo oscuro.
 */
function ServiceModal({ initial, onSave, onClose }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm]       = useState(
    initial
      ? {
          nombre:           initial.nombre,
          descripcion:      initial.descripcion ?? "",
          precio:           String(initial.precio),
          duracion_minutos: String(initial.duracion_minutos),
          categoria:        initial.categoria,
          imagen_url:       initial.imagen_url ?? "",
          activo:           initial.activo,
          orden:            String(initial.orden),
        }
      : EMPTY_FORM,
  );
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim())             errs.nombre   = "El nombre es obligatorio";
    if (!form.precio || isNaN(+form.precio) || +form.precio < 0)
                                          errs.precio   = "Precio inválido";
    if (!form.duracion_minutos || isNaN(+form.duracion_minutos) || +form.duracion_minutos < 1)
                                          errs.duracion_minutos = "Duración inválida";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        precio:           parseFloat(form.precio),
        duracion_minutos: parseInt(form.duracion_minutos, 10),
        orden:            parseInt(form.orden, 10) || 0,
        imagen_url:       form.imagen_url.trim() || null,
        descripcion:      form.descripcion.trim() || null,
      };
      await onSave(payload);
    } catch {
      /* Los errores se muestran via toast en el padre */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="sv-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Editar servicio" : "Nuevo servicio"}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sv-modal">
        <header className="sv-modal-header">
          <h2 className="sv-modal-title">{isEdit ? "Editar servicio" : "Nuevo servicio"}</h2>
          <button className="sv-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <form className="sv-form" onSubmit={handleSubmit} noValidate>
          {/* Nombre */}
          <div className="sv-field">
            <label className="sv-label" htmlFor="sv-nombre">Nombre *</label>
            <input
              id="sv-nombre"
              className={`sv-input ${errors.nombre ? "sv-input--error" : ""}`}
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Corte clásico"
              disabled={loading}
            />
            {errors.nombre && <span className="sv-error">{errors.nombre}</span>}
          </div>

          {/* Descripción */}
          <div className="sv-field">
            <label className="sv-label" htmlFor="sv-desc">Descripción</label>
            <textarea
              id="sv-desc"
              className="sv-input sv-textarea"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Descripción breve del servicio…"
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Precio + Duración */}
          <div className="sv-row">
            <div className="sv-field">
              <label className="sv-label" htmlFor="sv-precio">Precio (€) *</label>
              <input
                id="sv-precio"
                className={`sv-input ${errors.precio ? "sv-input--error" : ""}`}
                name="precio"
                type="number"
                min="0"
                step="0.5"
                value={form.precio}
                onChange={handleChange}
                placeholder="15"
                disabled={loading}
              />
              {errors.precio && <span className="sv-error">{errors.precio}</span>}
            </div>
            <div className="sv-field">
              <label className="sv-label" htmlFor="sv-duracion">Duración (min) *</label>
              <input
                id="sv-duracion"
                className={`sv-input ${errors.duracion_minutos ? "sv-input--error" : ""}`}
                name="duracion_minutos"
                type="number"
                min="1"
                step="5"
                value={form.duracion_minutos}
                onChange={handleChange}
                placeholder="30"
                disabled={loading}
              />
              {errors.duracion_minutos && (
                <span className="sv-error">{errors.duracion_minutos}</span>
              )}
            </div>
          </div>

          {/* Categoría + Orden */}
          <div className="sv-row">
            <div className="sv-field">
              <label className="sv-label" htmlFor="sv-cat">Categoría *</label>
              <select
                id="sv-cat"
                className="sv-input sv-select"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                disabled={loading}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{capitalize(c)}</option>
                ))}
              </select>
            </div>
            <div className="sv-field">
              <label className="sv-label" htmlFor="sv-orden">Orden</label>
              <input
                id="sv-orden"
                className="sv-input"
                name="orden"
                type="number"
                min="0"
                value={form.orden}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          {/* URL de imagen */}
          <div className="sv-field">
            <label className="sv-label" htmlFor="sv-img">URL de imagen</label>
            <input
              id="sv-img"
              className="sv-input"
              name="imagen_url"
              type="url"
              value={form.imagen_url}
              onChange={handleChange}
              placeholder="https://…"
              disabled={loading}
            />
          </div>

          {/* Activo toggle */}
          <div className="sv-field sv-field--inline">
            <input
              id="sv-activo"
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
              disabled={loading}
              className="sv-checkbox"
            />
            <label htmlFor="sv-activo" className="sv-label sv-label--inline">
              Servicio activo (visible en la web)
            </label>
          </div>

          {/* Botones */}
          <div className="sv-modal-footer">
            <button
              type="button"
              className="sv-btn sv-btn--ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="sv-btn sv-btn--primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading
                ? (isEdit ? "Guardando…" : "Creando…")
                : (isEdit ? "Guardar cambios" : "Crear servicio")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminServicios() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  /** null = cerrado; undefined = modo crear; objeto = modo editar */
  const [modalData, setModalData] = useState(null);

  // ── Carga de datos ────────────────────────────────────────────────────────

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listAdminServices();
      // El endpoint devuelve List[ServiceOut] directamente (sin paginación)
      setServices(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  const handleToggleActivo = useCallback(async (id, activo) => {
    // Optimistic UI
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, activo } : s)),
    );
    try {
      await updateService(id, { activo });
      toast.success(activo ? "Servicio activado" : "Servicio desactivado");
    } catch {
      // Revertir
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, activo: !activo } : s)),
      );
      toast.error("No se pudo cambiar el estado del servicio");
    }
  }, []);

  const handleSave = useCallback(async (formData) => {
    const isEdit = Boolean(modalData?.id);
    try {
      if (isEdit) {
        const { data } = await updateService(modalData.id, formData);
        setServices((prev) =>
          prev.map((s) => (s.id === modalData.id ? data : s)),
        );
        toast.success("Servicio actualizado");
      } else {
        const { data } = await createService(formData);
        setServices((prev) => [...prev, data]);
        toast.success("Servicio creado");
      }
      setModalData(null);
    } catch (err) {
      const msg = err?.response?.data?.detail ?? "Error al guardar el servicio";
      toast.error(msg);
      throw err; // para que el modal sepa que falló
    }
  }, [modalData]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Servicio eliminado");
    } catch {
      toast.error("No se pudo eliminar el servicio");
      throw new Error("delete_failed");
    }
  }, []);

  // ── Datos derivados ───────────────────────────────────────────────────────

  const grouped = useMemo(
    () => agruparPorCategoria(services),
    [services],
  );

  const totalActivos = useMemo(
    () => services.filter((s) => s.activo).length,
    [services],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="sv-page">

      {/* ── Resumen rápido ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="sv-stats">
          <div className="sv-stat">
            <span className="sv-stat-value">{services.length}</span>
            <span className="sv-stat-label">Total</span>
          </div>
          <div className="sv-stat sv-stat--accent">
            <span className="sv-stat-value">{totalActivos}</span>
            <span className="sv-stat-label">Activos</span>
          </div>
          <div className="sv-stat">
            <span className="sv-stat-value">{services.length - totalActivos}</span>
            <span className="sv-stat-label">Inactivos</span>
          </div>
          <div className="sv-stat">
            <span className="sv-stat-value">{grouped.size}</span>
            <span className="sv-stat-label">Categorías</span>
          </div>
        </div>
      )}

      {/* ── Contenido principal ───────────────────────────────────────── */}
      {loading && (
        <div className="sv-list">
          {Array.from({ length: 5 }, (_, i) => <ServiceSkeleton key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="sv-error-state">
          <p>⚠️ {error}</p>
          <button className="sv-btn sv-btn--primary" onClick={fetchServices}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && services.length === 0 && (
        <div className="sv-empty">
          <p className="sv-empty-icon">✂️</p>
          <p>Aún no hay servicios.</p>
          <button
            className="sv-btn sv-btn--primary"
            onClick={() => setModalData(undefined)}
          >
            + Crear primer servicio
          </button>
        </div>
      )}

      {/* Lista agrupada por categoría */}
      {!loading && !error && services.length > 0 && (
        <div className="sv-groups">
          {[...grouped.entries()].map(([cat, items]) => (
            <section key={cat} className="sv-group">
              <h2 className="sv-group-title">
                {capitalize(cat)}
                <span className="sv-group-count">{items.length}</span>
              </h2>
              <div className="sv-list">
                {items
                  .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
                  .map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onEdit={(s) => setModalData(s)}
                      onToggleActivo={handleToggleActivo}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── FAB — Nuevo servicio ──────────────────────────────────────── */}
      {!loading && !error && (
        <button
          className="sv-fab"
          onClick={() => setModalData(undefined)}
          aria-label="Crear nuevo servicio"
          title="Nuevo servicio"
        >
          +
        </button>
      )}

      {/* ── Modal de formulario ───────────────────────────────────────── */}
      {modalData !== null && (
        <ServiceModal
          initial={modalData}
          onSave={handleSave}
          onClose={() => setModalData(null)}
        />
      )}

      {/* ── Estilos ──────────────────────────────────────────────────── */}
      <style>{`
        .sv-page {
          --brand:      #CC2020;
          --brand-dim:  rgba(204, 32, 32, .12);
          --brand-hover:#a81a1a;
          --bg0:        #090909;
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
          /* Espacio inferior para que el FAB no tape el último elemento */
          padding-bottom: 5rem;
        }

        /* ── Métricas ── */
        .sv-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: .75rem;
        }
        @media (max-width: 480px) { .sv-stats { grid-template-columns: repeat(2, 1fr); } }
        .sv-stat {
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
        .sv-stat--accent {
          border-color: rgba(204, 32, 32, .3);
          background: var(--brand-dim);
        }
        .sv-stat-value {
          color: #fff;
          font-size: 1.75rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .sv-stat--accent .sv-stat-value { color: var(--brand); }
        .sv-stat-label {
          color: var(--text-muted);
          font-size: .6875rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        /* ── Grupos de categoría ── */
        .sv-groups { display: flex; flex-direction: column; gap: 2rem; }
        .sv-group  { display: flex; flex-direction: column; gap: .75rem; }
        .sv-group-title {
          align-items: center;
          color: var(--text-muted);
          display: flex;
          font-size: .6875rem;
          font-weight: 800;
          gap: .5rem;
          letter-spacing: .1em;
          margin: 0;
          text-transform: uppercase;
        }
        .sv-group-count {
          background: rgba(255,255,255,.07);
          border-radius: 999px;
          font-size: .6875rem;
          padding: .1rem .45rem;
        }

        /* ── Lista ── */
        .sv-list { display: flex; flex-direction: column; gap: .625rem; }

        /* ── Tarjeta de servicio ── */
        .sv-card {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          gap: .75rem;
          padding: 1.125rem 1.25rem;
          transition: border-color .2s;
        }
        .sv-card:hover { border-color: #3a3a3a; }
        .sv-card--inactive { opacity: .55; border-style: dashed; }

        .sv-card-top {
          align-items: flex-start;
          display: flex;
          gap: 1rem;
          justify-content: space-between;
        }
        .sv-card-info {
          display: flex;
          flex-direction: column;
          gap: .25rem;
          min-width: 0;
        }
        .sv-card-name {
          color: #fff;
          font-size: .9375rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sv-card-desc {
          color: var(--text-muted);
          font-size: .8125rem;
          line-height: 1.4;
        }
        .sv-card-price-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          gap: .125rem;
        }
        .sv-card-price {
          color: var(--brand);
          font-size: 1.125rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .sv-card-duration {
          color: var(--text-muted);
          font-size: .75rem;
        }

        .sv-card-bottom {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
          justify-content: space-between;
        }
        .sv-badge {
          border-radius: 999px;
          font-size: .6875rem;
          font-weight: 700;
          padding: .2rem .6rem;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .sv-badge--active   { background: rgba(46,204,113,.12); color: #2ecc71; }
        .sv-badge--inactive { background: rgba(136,136,136,.12); color: #888; }

        .sv-card-actions {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: .375rem;
        }

        /* ── Confirmación inline ── */
        .sv-confirm {
          align-items: center;
          display: flex;
          gap: .375rem;
        }
        .sv-confirm-text {
          color: var(--danger);
          font-size: .8125rem;
          font-weight: 600;
        }

        /* ── Botones ── */
        .sv-btn {
          align-items: center;
          border-radius: .4rem;
          cursor: pointer;
          display: inline-flex;
          font-size: .8125rem;
          font-weight: 600;
          gap: .3rem;
          padding: .375rem .75rem;
          transition: background .15s, color .15s, border-color .15s, opacity .15s;
          white-space: nowrap;
        }
        .sv-btn:disabled { opacity: .5; cursor: not-allowed; }

        .sv-btn--primary {
          background: var(--brand);
          border: 1px solid var(--brand);
          color: #fff;
        }
        .sv-btn--primary:hover:not(:disabled) { background: var(--brand-hover); }

        .sv-btn--ghost {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .sv-btn--ghost:hover:not(:disabled) { border-color: #555; color: #fff; }

        .sv-btn--danger {
          background: var(--danger);
          border: 1px solid var(--danger);
          color: #fff;
        }
        .sv-btn--danger:hover:not(:disabled) { background: #c0392b; }

        .sv-btn--danger-ghost {
          border-color: transparent;
          padding: .375rem .5rem;
        }
        .sv-btn--danger-ghost:hover:not(:disabled) {
          border-color: var(--danger);
          color: var(--danger);
        }

        /* ── FAB ── */
        .sv-fab {
          background: var(--brand);
          border: none;
          border-radius: 50%;
          bottom: calc(64px + 1.25rem); /* encima de la bottom-nav móvil */
          box-shadow: 0 4px 20px rgba(204, 32, 32, .45);
          color: #fff;
          cursor: pointer;
          font-size: 1.75rem;
          height: 56px;
          line-height: 1;
          position: fixed;
          right: 1.25rem;
          transition: background .2s, transform .15s, box-shadow .2s;
          width: 56px;
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sv-fab:hover { background: var(--brand-hover); transform: scale(1.07); }
        .sv-fab:active { transform: scale(.95); }
        @media (min-width: 768px) {
          /* En desktop no hay bottom-nav, bajamos menos */
          .sv-fab { bottom: 1.5rem; }
        }

        /* ── Skeleton ── */
        @keyframes sv-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .sv-skeleton {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          gap: .625rem;
          padding: 1.25rem;
        }
        .sv-sk-line {
          background-image: linear-gradient(90deg, #181818 25%, #222 50%, #181818 75%);
          background-size: 400px 100%;
          border-radius: 4px;
          animation: sv-shimmer 1.4s infinite linear;
          height: 12px;
        }
        .sv-sk-short { width: 40%; }
        .sv-sk-long  { width: 85%; }
        .sv-sk-med   { width: 60%; }

        /* ── Error / Vacío ── */
        .sv-error-state, .sv-empty {
          align-items: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 3rem 1rem;
          text-align: center;
        }
        .sv-empty-icon { font-size: 2.5rem; margin: 0; }

        /* ────────────────────────────────────────────────────────────────
           MODAL
        ──────────────────────────────────────────────────────────────── */
        .sv-overlay {
          background: rgba(0, 0, 0, .75);
          bottom: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          left: 0;
          position: fixed;
          right: 0;
          top: 0;
          z-index: 500;
          backdrop-filter: blur(3px);
        }
        @media (min-width: 600px) {
          .sv-overlay { align-items: center; }
        }

        .sv-modal {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: 1rem 1rem 0 0;
          display: flex;
          flex-direction: column;
          max-height: 92dvh;
          overflow-y: auto;
          padding: 1.5rem;
          width: 100%;
          animation: sv-slide-up .22s ease;
        }
        @media (min-width: 600px) {
          .sv-modal {
            border-radius: 1rem;
            max-width: 520px;
            max-height: 88dvh;
            animation: sv-fade-in .18s ease;
          }
        }
        @keyframes sv-slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes sv-fade-in {
          from { opacity: 0; transform: scale(.97); }
          to   { opacity: 1; transform: scale(1);   }
        }

        .sv-modal-header {
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .sv-modal-title {
          color: #fff;
          font-size: 1.0625rem;
          font-weight: 700;
          margin: 0;
        }
        .sv-modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.125rem;
          line-height: 1;
          padding: .25rem;
          transition: color .15s;
        }
        .sv-modal-close:hover { color: #fff; }

        /* ── Formulario ── */
        .sv-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .sv-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .75rem;
        }
        .sv-field {
          display: flex;
          flex-direction: column;
          gap: .375rem;
        }
        .sv-field--inline {
          flex-direction: row;
          align-items: center;
          gap: .5rem;
        }
        .sv-label {
          color: #ccc;
          font-size: .8125rem;
          font-weight: 600;
        }
        .sv-label--inline { font-weight: 500; cursor: pointer; }
        .sv-input {
          background: #0d0d0d;
          border: 1px solid var(--border);
          border-radius: .5rem;
          color: var(--text);
          font-size: .9rem;
          outline: none;
          padding: .575rem .875rem;
          transition: border-color .2s;
          width: 100%;
        }
        .sv-input:focus { border-color: var(--brand); }
        .sv-input--error { border-color: var(--danger); }
        .sv-input::placeholder { color: #444; }
        .sv-input:disabled { opacity: .5; cursor: not-allowed; }
        .sv-textarea {
          resize: vertical;
          min-height: 4.5rem;
          font-family: inherit;
        }
        .sv-select { cursor: pointer; }
        .sv-checkbox {
          accent-color: var(--brand);
          cursor: pointer;
          height: 16px;
          width: 16px;
          flex-shrink: 0;
        }
        .sv-error {
          color: var(--danger);
          font-size: .75rem;
        }

        .sv-modal-footer {
          border-top: 1px solid var(--border);
          display: flex;
          gap: .625rem;
          justify-content: flex-end;
          margin-top: .5rem;
          padding-top: 1rem;
        }
      `}</style>
    </div>
  );
}
