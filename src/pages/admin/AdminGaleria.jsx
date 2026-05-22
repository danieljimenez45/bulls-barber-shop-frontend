/**
 * AdminGaleria.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Panel de gestión de la galería de fotos.
 *
 * Funcionalidades:
 *  - Zona de subida: drag & drop o selector de archivo
 *    · Preview de la imagen antes de confirmar
 *    · Campos: título (opcional) y categoría
 *    · Barra de progreso real durante la subida (XHR onprogress)
 *  - Grid responsive filtrado por categoría
 *  - Eliminación con confirmación inline por tarjeta
 *  - Skeleton animado durante la carga inicial
 *  - Estado vacío y estado de error con reintento
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import {
  listGallery,
  uploadGalleryImage,
  deleteGalleryImage,
} from "../../services/adminApi";

// ── Constantes ────────────────────────────────────────────────────────────────

/** Categorías disponibles en la galería. */
const CATEGORIAS = ["corte", "barba", "local", "otro"];

/** Tipos MIME aceptados en el input de archivo. */
const ACCEPT_MIME = "image/jpeg,image/png,image/webp,image/gif";

// ── Helpers ───────────────────────────────────────────────────────────────────

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Devuelve un object URL para previsualización y lo registra para revocación. */
function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

/** Esqueleto animado de una celda del grid. */
function GridSkeleton() {
  return (
    <div className="gl-skeleton" aria-hidden="true" />
  );
}

/**
 * Tarjeta de imagen.
 * Gestiona confirmación de eliminación de forma local.
 */
function ImageCard({ image, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading,       setLoading]       = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(image.id);
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <article className="gl-card">
      <img
        src={image.imagen_url}
        alt={image.titulo ?? image.categoria}
        className="gl-card-img"
        loading="lazy"
      />

      {/* Overlay permanente en la zona inferior */}
      <div className="gl-card-overlay">
        <div className="gl-card-meta">
          {image.titulo && (
            <span className="gl-card-title">{image.titulo}</span>
          )}
          <span className="gl-card-cat">{capitalize(image.categoria)}</span>
        </div>

        {/* Confirmación de eliminación */}
        {confirmDelete ? (
          <div className="gl-confirm">
            <button
              className="gl-btn gl-btn--danger"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "…" : "Borrar"}
            </button>
            <button
              className="gl-btn gl-btn--ghost-light"
              onClick={() => setConfirmDelete(false)}
              disabled={loading}
            >
              No
            </button>
          </div>
        ) : (
          <button
            className="gl-btn gl-btn--delete"
            onClick={() => setConfirmDelete(true)}
            aria-label="Eliminar imagen"
            title="Eliminar"
          >
            🗑️
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * Zona de subida: drag & drop + selector de archivo + preview + formulario.
 */
function UploadZone({ onUploaded }) {
  const inputRef  = useRef(null);

  const [file,       setFile]       = useState(null);       // File seleccionado
  const [preview,    setPreview]    = useState(null);       // object URL del preview
  const [titulo,     setTitulo]     = useState("");
  const [categoria,  setCategoria]  = useState("corte");
  const [progress,   setProgress]   = useState(0);          // 0–100
  const [uploading,  setUploading]  = useState(false);
  const [dragging,   setDragging]   = useState(false);

  // Limpiar object URL al desmontar o cambiar archivo
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const applyFile = (f) => {
    if (!f || !f.type.startsWith("image/")) {
      toast.error("Solo se aceptan imágenes (jpg, png, webp, gif)");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 10 MB");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(createPreviewUrl(f));
    setProgress(0);
  };

  // ── Drag & drop handlers ────────────────────────────────────────────────

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) applyFile(dropped);
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file",      file);
    formData.append("categoria", categoria);
    if (titulo.trim()) formData.append("titulo", titulo.trim());

    setUploading(true);
    setProgress(0);

    try {
      const newImage = await uploadGalleryImage(formData, setProgress);
      toast.success("Imagen subida correctamente");
      onUploaded(newImage);
      // Resetear formulario
      setFile(null);
      setPreview(null);
      setTitulo("");
      setCategoria("corte");
      setProgress(0);
    } catch (err) {
      toast.error(err.message ?? "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const cancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setProgress(0);
  };

  return (
    <div className="gl-upload-wrap">
      {/* ── Zona de drop ── */}
      {!file && (
        <div
          className={`gl-dropzone ${dragging ? "gl-dropzone--active" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Zona de subida de imagen"
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <span className="gl-drop-icon" aria-hidden="true">🖼️</span>
          <p className="gl-drop-text">
            Arrastra una foto aquí<br />
            <span className="gl-drop-sub">o haz clic para seleccionarla</span>
          </p>
          <span className="gl-drop-hint">JPG · PNG · WEBP · GIF · Máx. 10 MB</span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_MIME}
            style={{ display: "none" }}
            onChange={(e) => applyFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* ── Preview + formulario ── */}
      {file && (
        <form className="gl-preview-form" onSubmit={handleSubmit}>
          <div className="gl-preview-row">
            {/* Miniatura */}
            <div className="gl-preview-thumb-wrap">
              <img src={preview} alt="Vista previa" className="gl-preview-thumb" />
            </div>

            {/* Campos */}
            <div className="gl-preview-fields">
              <div className="gl-field">
                <label className="gl-label" htmlFor="gl-titulo">Título (opcional)</label>
                <input
                  id="gl-titulo"
                  className="gl-input"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Degradado clásico"
                  disabled={uploading}
                  maxLength={80}
                />
              </div>

              <div className="gl-field">
                <label className="gl-label" htmlFor="gl-cat">Categoría</label>
                <select
                  id="gl-cat"
                  className="gl-input gl-select"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  disabled={uploading}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{capitalize(c)}</option>
                  ))}
                </select>
              </div>

              {/* Nombre del archivo */}
              <p className="gl-file-name" title={file.name}>{file.name}</p>
            </div>
          </div>

          {/* Barra de progreso — solo visible mientras se sube */}
          {uploading && (
            <div className="gl-progress-wrap" aria-label={`Subiendo: ${progress}%`}>
              <div className="gl-progress-bar" style={{ width: `${progress}%` }} />
              <span className="gl-progress-pct">{progress}%</span>
            </div>
          )}

          {/* Acciones */}
          <div className="gl-preview-actions">
            <button
              type="button"
              className="gl-btn gl-btn--ghost"
              onClick={cancel}
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="gl-btn gl-btn--primary"
              disabled={uploading}
              aria-busy={uploading}
            >
              {uploading ? `Subiendo… ${progress}%` : "Subir imagen"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

/** Filtros del grid de galería. */
const FILTROS = [{ key: "", label: "Todas" }, ...CATEGORIAS.map((c) => ({ key: c, label: capitalize(c) }))];

export default function AdminGaleria() {
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filtro,  setFiltro]  = useState("");

  // ── Carga de imágenes ─────────────────────────────────────────────────────

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listGallery({ size: 100 });
      setImages(data.items ?? []);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "No se pudieron cargar las imágenes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  /** Añade la imagen recién subida al principio del array local. */
  const handleUploaded = useCallback((newImage) => {
    setImages((prev) => [newImage, ...prev]);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteGalleryImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success("Imagen eliminada");
    } catch {
      toast.error("No se pudo eliminar la imagen");
      throw new Error("delete_failed");
    }
  }, []);

  // ── Filtrado local ────────────────────────────────────────────────────────

  const filtradas = filtro
    ? images.filter((img) => img.categoria === filtro)
    : images;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="gl-page">

      {/* ── Zona de subida ────────────────────────────────────────────── */}
      <section className="gl-section" aria-label="Subir imagen">
        <h2 className="gl-section-title">Subir imagen</h2>
        <UploadZone onUploaded={handleUploaded} />
      </section>

      {/* ── Stats rápidas ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="gl-stats">
          <div className="gl-stat">
            <span className="gl-stat-value">{images.length}</span>
            <span className="gl-stat-label">Fotos</span>
          </div>
          {CATEGORIAS.map((cat) => {
            const n = images.filter((img) => img.categoria === cat).length;
            return n > 0 ? (
              <div key={cat} className="gl-stat">
                <span className="gl-stat-value">{n}</span>
                <span className="gl-stat-label">{capitalize(cat)}</span>
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* ── Filtros ────────────────────────────────────────────────────── */}
      {!loading && !error && images.length > 0 && (
        <div className="gl-filters" role="group" aria-label="Filtrar galería">
          {FILTROS.map(({ key, label }) => (
            <button
              key={key}
              className={`gl-filter-btn ${filtro === key ? "gl-filter-btn--active" : ""}`}
              onClick={() => setFiltro(key)}
            >
              {label}
              <span className="gl-filter-count">
                {key === "" ? images.length : images.filter((img) => img.categoria === key).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <section className="gl-section" aria-label="Galería de imágenes">

        {loading && (
          <div className="gl-grid">
            {Array.from({ length: 9 }, (_, i) => <GridSkeleton key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="gl-error">
            <p>⚠️ {error}</p>
            <button className="gl-btn gl-btn--primary" onClick={fetchImages}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && filtradas.length === 0 && (
          <div className="gl-empty">
            <p className="gl-empty-icon">🖼️</p>
            <p>
              {images.length === 0
                ? "La galería está vacía. Sube la primera foto."
                : `No hay imágenes en la categoría "${capitalize(filtro)}".`}
            </p>
          </div>
        )}

        {!loading && !error && filtradas.length > 0 && (
          <div className="gl-grid">
            {filtradas.map((img) => (
              <ImageCard key={img.id} image={img} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      {/* ── Estilos ──────────────────────────────────────────────────── */}
      <style>{`
        .gl-page {
          --brand:       #CC2020;
          --brand-dim:   rgba(204, 32, 32, .12);
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
          gap: 1.5rem;
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Sección ── */
        .gl-section { display: flex; flex-direction: column; gap: .875rem; }
        .gl-section-title {
          color: var(--text-muted);
          font-size: .6875rem;
          font-weight: 800;
          letter-spacing: .1em;
          margin: 0;
          text-transform: uppercase;
        }

        /* ── Stats ── */
        .gl-stats {
          display: flex;
          flex-wrap: wrap;
          gap: .625rem;
        }
        .gl-stat {
          align-items: center;
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .625rem;
          display: flex;
          flex-direction: column;
          gap: .2rem;
          padding: .625rem 1rem;
          text-align: center;
          min-width: 60px;
        }
        .gl-stat-value {
          color: #fff;
          font-size: 1.25rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .gl-stat-label {
          color: var(--text-muted);
          font-size: .6875rem;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        /* ── Filtros ── */
        .gl-filters {
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
        }
        .gl-filter-btn {
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
        .gl-filter-btn:hover { color: #fff; border-color: #444; }
        .gl-filter-btn--active {
          background: var(--brand-dim);
          border-color: var(--brand);
          color: var(--brand);
          font-weight: 700;
        }
        .gl-filter-count {
          background: rgba(255,255,255,.08);
          border-radius: 999px;
          font-size: .6875rem;
          padding: .1rem .4rem;
        }
        .gl-filter-btn--active .gl-filter-count {
          background: rgba(204, 32, 32, .2);
        }

        /* ── Grid de imágenes ── */
        .gl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: .75rem;
        }
        @media (max-width: 480px) {
          .gl-grid { grid-template-columns: repeat(2, 1fr); gap: .5rem; }
        }

        /* ── Tarjeta de imagen ── */
        .gl-card {
          aspect-ratio: 1 / 1;
          border-radius: .625rem;
          overflow: hidden;
          position: relative;
          background: var(--bg2);
          border: 1px solid var(--border);
        }
        .gl-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .3s ease;
        }
        .gl-card:hover .gl-card-img { transform: scale(1.04); }

        /* Overlay inferior siempre visible */
        .gl-card-overlay {
          align-items: flex-end;
          background: linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 55%);
          bottom: 0;
          display: flex;
          justify-content: space-between;
          left: 0;
          padding: .625rem .75rem .625rem .75rem;
          position: absolute;
          right: 0;
          top: 0;
        }
        .gl-card-meta {
          display: flex;
          flex-direction: column;
          gap: .1rem;
          max-width: 70%;
        }
        .gl-card-title {
          color: #fff;
          font-size: .75rem;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.2;
          text-shadow: 0 1px 3px rgba(0,0,0,.8);
        }
        .gl-card-cat {
          color: rgba(255,255,255,.6);
          font-size: .625rem;
          font-weight: 600;
          letter-spacing: .06em;
          text-shadow: 0 1px 3px rgba(0,0,0,.8);
          text-transform: uppercase;
        }

        /* Confirmación inline en overlay */
        .gl-confirm {
          display: flex;
          gap: .3rem;
          align-items: center;
          flex-shrink: 0;
        }

        /* ── Zona de subida (dropzone) ── */
        .gl-upload-wrap {
          width: 100%;
        }
        .gl-dropzone {
          align-items: center;
          border: 2px dashed var(--border);
          border-radius: .75rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: .625rem;
          justify-content: center;
          min-height: 160px;
          padding: 2rem 1.5rem;
          text-align: center;
          transition: border-color .2s, background .2s;
        }
        .gl-dropzone:hover,
        .gl-dropzone--active {
          border-color: var(--brand);
          background: var(--brand-dim);
        }
        .gl-drop-icon  { font-size: 2.25rem; line-height: 1; }
        .gl-drop-text  { color: var(--text-muted); font-size: .9rem; margin: 0; line-height: 1.5; }
        .gl-drop-text strong { color: #fff; }
        .gl-drop-sub   { color: var(--brand); font-size: .875rem; }
        .gl-drop-hint  { color: #555; font-size: .75rem; }

        /* ── Preview + formulario ── */
        .gl-preview-form {
          background: var(--bg1);
          border: 1px solid var(--border);
          border-radius: .75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.25rem;
        }
        .gl-preview-row {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .gl-preview-thumb-wrap {
          flex-shrink: 0;
          width: 120px;
          height: 120px;
          border-radius: .5rem;
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--bg2);
        }
        .gl-preview-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gl-preview-fields {
          display: flex;
          flex-direction: column;
          gap: .75rem;
          flex: 1;
          min-width: 180px;
        }
        .gl-field {
          display: flex;
          flex-direction: column;
          gap: .35rem;
        }
        .gl-label {
          color: #ccc;
          font-size: .8125rem;
          font-weight: 600;
        }
        .gl-input {
          background: #0d0d0d;
          border: 1px solid var(--border);
          border-radius: .5rem;
          color: var(--text);
          font-size: .875rem;
          outline: none;
          padding: .5rem .75rem;
          transition: border-color .2s;
          width: 100%;
        }
        .gl-input:focus { border-color: var(--brand); }
        .gl-input::placeholder { color: #444; }
        .gl-input:disabled { opacity: .5; }
        .gl-select { cursor: pointer; }
        .gl-file-name {
          color: #555;
          font-size: .75rem;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Barra de progreso ── */
        .gl-progress-wrap {
          align-items: center;
          background: var(--bg2);
          border-radius: 999px;
          display: flex;
          gap: .75rem;
          overflow: hidden;
          position: relative;
          height: 22px;
          padding: 0 .625rem;
        }
        .gl-progress-bar {
          background: var(--brand);
          border-radius: 999px;
          height: 6px;
          flex: 1;
          position: relative;
          transition: width .15s linear;
          /* barra vive dentro de un pseudo-contenedor */
          max-width: calc(100% - 3rem);
        }
        /* Replanteamos: barra absoluta + texto */
        .gl-progress-wrap {
          position: relative;
          background: #1a1a1a;
          border-radius: 999px;
          height: 26px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .gl-progress-bar {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: var(--brand);
          border-radius: 999px;
          transition: width .15s linear;
        }
        .gl-progress-pct {
          position: relative;
          z-index: 1;
          color: #fff;
          font-size: .75rem;
          font-weight: 700;
          width: 100%;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        /* ── Acciones del preview ── */
        .gl-preview-actions {
          display: flex;
          gap: .625rem;
          justify-content: flex-end;
        }

        /* ── Botones ── */
        .gl-btn {
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
        .gl-btn:disabled { opacity: .5; cursor: not-allowed; }

        .gl-btn--primary {
          background: var(--brand);
          border: 1px solid var(--brand);
          color: #fff;
        }
        .gl-btn--primary:hover:not(:disabled) { background: var(--brand-hover); }

        .gl-btn--ghost {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .gl-btn--ghost:hover:not(:disabled) { border-color: #555; color: #fff; }

        .gl-btn--ghost-light {
          background: rgba(255,255,255,.1);
          border: 1px solid rgba(255,255,255,.2);
          color: #fff;
          font-size: .75rem;
          padding: .3rem .625rem;
        }
        .gl-btn--ghost-light:hover:not(:disabled) { background: rgba(255,255,255,.18); }

        .gl-btn--danger {
          background: var(--danger);
          border: 1px solid var(--danger);
          color: #fff;
          font-size: .75rem;
          padding: .3rem .625rem;
        }
        .gl-btn--danger:hover:not(:disabled) { background: #c0392b; }

        .gl-btn--delete {
          background: rgba(0,0,0,.4);
          border: 1px solid rgba(255,255,255,.15);
          color: #fff;
          font-size: .875rem;
          padding: .3rem .5rem;
          border-radius: .375rem;
          flex-shrink: 0;
        }
        .gl-btn--delete:hover { background: var(--danger); border-color: var(--danger); }

        /* ── Skeleton ── */
        @keyframes gl-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .gl-skeleton {
          aspect-ratio: 1 / 1;
          background-image: linear-gradient(90deg, #181818 25%, #222 50%, #181818 75%);
          background-size: 400px 100%;
          border-radius: .625rem;
          animation: gl-shimmer 1.4s infinite linear;
          border: 1px solid var(--border);
        }

        /* ── Error / Vacío ── */
        .gl-error, .gl-empty {
          align-items: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: .875rem;
          padding: 3rem 1rem;
          text-align: center;
        }
        .gl-empty-icon { font-size: 2.5rem; margin: 0; }
      `}</style>
    </div>
  );
}
