/**
 * ExportCSVModal.jsx
 * Modal para seleccionar el rango de fechas antes de exportar las reservas a CSV.
 * Por defecto propone el mes actual (primer y último día).
 */

import { useState, useEffect, useRef } from "react";
import { exportBookingsCSV } from "../../services/adminApi";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Devuelve "YYYY-MM-DD" de un objeto Date. */
const toISO = (date) => date.toISOString().slice(0, 10);

/** Calcula el primer y último día del mes actual. */
function currentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { desde: toISO(first), hasta: toISO(last) };
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function ExportCSVModal({ onClose }) {
  const { desde: defaultDesde, hasta: defaultHasta } = currentMonthRange();

  const [desde, setDesde] = useState(defaultDesde);
  const [hasta, setHasta] = useState(defaultHasta);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef(null);

  // Cierra el modal al pulsar Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus trap: foco inicial en el primer input
  useEffect(() => {
    dialogRef.current?.querySelector("input")?.focus();
  }, []);

  const handleExport = async () => {
    if (!desde || !hasta) {
      toast.error("Selecciona las dos fechas");
      return;
    }
    if (hasta < desde) {
      toast.error("La fecha final debe ser posterior a la inicial");
      return;
    }
    setLoading(true);
    try {
      await exportBookingsCSV(desde, hasta);
      toast.success("CSV descargado correctamente");
      onClose();
    } catch (err) {
      toast.error(err.message || "Error al exportar");
    } finally {
      setLoading(false);
    }
  };

  // Cierra al hacer clic fuera del panel
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="ecm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ecm-title"
      onClick={handleBackdropClick}
    >
      <div className="ecm-panel" ref={dialogRef}>
        {/* Cabecera */}
        <div className="ecm-header">
          <h2 id="ecm-title" className="ecm-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar reservas a CSV
          </h2>
          <button
            className="ecm-close"
            onClick={onClose}
            aria-label="Cerrar modal"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="ecm-body">
          <p className="ecm-description">
            Selecciona el rango de fechas. Se incluyen todas las reservas con fecha
            dentro del período (ambos extremos inclusive).
          </p>

          <div className="ecm-fields">
            <div className="ecm-field">
              <label htmlFor="ecm-desde">Desde</label>
              <input
                id="ecm-desde"
                type="date"
                value={desde}
                max={hasta}
                onChange={(e) => setDesde(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="ecm-field">
              <label htmlFor="ecm-hasta">Hasta</label>
              <input
                id="ecm-hasta"
                type="date"
                value={hasta}
                min={desde}
                onChange={(e) => setHasta(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <p className="ecm-hint">
            📋 Columnas exportadas: ID · Cliente · Teléfono · Servicio · Fecha/Hora · Estado · Creada en
          </p>
        </div>

        {/* Pie */}
        <div className="ecm-footer">
          <button
            className="ecm-btn ecm-btn--cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="ecm-btn ecm-btn--export"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? (
              <span className="ecm-spinner" aria-hidden="true" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
            {loading ? "Exportando…" : "Descargar CSV"}
          </button>
        </div>
      </div>

      <style>{`
        .ecm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 9000;
          backdrop-filter: blur(4px);
        }
        .ecm-panel {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 1rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 16px 48px rgba(0,0,0,.6);
          animation: ecm-in .18s ease;
        }
        @keyframes ecm-in {
          from { opacity: 0; transform: translateY(-12px) scale(.97); }
          to   { opacity: 1; transform: none; }
        }
        .ecm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #2a2a2a;
        }
        .ecm-title {
          display: flex;
          align-items: center;
          gap: .5rem;
          color: #fff;
          font-size: 1.05rem;
          font-weight: 600;
          margin: 0;
        }
        .ecm-close {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 1.1rem;
          line-height: 1;
          padding: .25rem .5rem;
          border-radius: .375rem;
          transition: color .15s, background .15s;
        }
        .ecm-close:hover:not(:disabled) { color: #fff; background: #2a2a2a; }
        .ecm-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .ecm-description { color: #aaa; font-size: .875rem; line-height: 1.5; margin: 0; }
        .ecm-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .ecm-field { display: flex; flex-direction: column; gap: .375rem; }
        .ecm-field label { color: #ccc; font-size: .8125rem; font-weight: 500; }
        .ecm-field input {
          background: #0f0f0f;
          border: 1px solid #333;
          border-radius: .5rem;
          color: #fff;
          font-size: .9rem;
          padding: .5rem .75rem;
          outline: none;
          transition: border-color .2s;
          color-scheme: dark;
        }
        .ecm-field input:focus { border-color: #CC2020; }
        .ecm-field input:disabled { opacity: .5; cursor: not-allowed; }
        .ecm-hint {
          color: #666;
          font-size: .8125rem;
          background: #0f0f0f;
          border: 1px solid #222;
          border-radius: .5rem;
          padding: .625rem .875rem;
          margin: 0;
          line-height: 1.5;
        }
        .ecm-footer {
          display: flex;
          gap: .75rem;
          justify-content: flex-end;
          padding: 1rem 1.5rem;
          border-top: 1px solid #2a2a2a;
        }
        .ecm-btn {
          border: none;
          border-radius: .5rem;
          cursor: pointer;
          font-size: .9rem;
          font-weight: 600;
          padding: .625rem 1.25rem;
          display: flex;
          align-items: center;
          gap: .4rem;
          transition: background .2s, opacity .2s;
        }
        .ecm-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ecm-btn--cancel { background: #2a2a2a; color: #ccc; }
        .ecm-btn--cancel:hover:not(:disabled) { background: #333; }
        .ecm-btn--export { background: #CC2020; color: #fff; }
        .ecm-btn--export:hover:not(:disabled) { background: #a81a1a; }
        .ecm-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ecm-spin .7s linear infinite;
        }
        @keyframes ecm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
