/**
 * errors.js — errores estructurados de la capa HTTP.
 *
 * Normaliza las respuestas de error de FastAPI en un objeto uniforme:
 *   { detail: "mensaje" }              → ApiError con message
 *   { detail: [{loc, msg, type}...] }  → ApiError con fields (validación Pydantic)
 */

// ── ApiError ──────────────────────────────────────────────────────────────────

/**
 * Error HTTP estructurado que viaja desde la capa de servicio hasta la UI.
 *
 * @property {number} status   - Código HTTP (0 si no hubo respuesta)
 * @property {string} message  - Mensaje legible para mostrar al usuario
 * @property {Record<string, string>} fields - Errores por campo en errores 422
 */
export class ApiError extends Error {
  constructor(status, message, fields = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

// ── parseApiError ─────────────────────────────────────────────────────────────

/**
 * Convierte un error de Axios (o cualquier objeto con `.response`) en ApiError.
 *
 * Casos:
 *   - 422 Pydantic: detail es array → extrae campos + mensajes
 *   - 4xx/5xx con detail string → usa ese string
 *   - Sin respuesta (red) → usa err.message
 *
 * @param {unknown} err
 * @returns {ApiError}
 */
export function parseApiError(err) {
  const status = err?.response?.status ?? 0;
  const detail = err?.response?.data?.detail;

  // Errores de validación Pydantic: array de { loc: string[], msg, type }
  if (Array.isArray(detail)) {
    const fields = {};
    detail.forEach(({ loc, msg }) => {
      const field = String(loc[loc.length - 1]);
      fields[field] = msg;
    });
    return new ApiError(status, "Error de validación", fields);
  }

  const message =
    typeof detail === "string"
      ? detail
      : (err?.message ?? "Error desconocido");

  return new ApiError(status, message, {});
}
