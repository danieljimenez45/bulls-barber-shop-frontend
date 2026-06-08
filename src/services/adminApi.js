/**
 * adminApi.js — cliente HTTP de administración (requiere JWT).
 *
 * El token se almacena en localStorage bajo la clave TOKEN_KEY
 * ("bulls_admin_token") y se inyecta automáticamente en cada petición
 * gracias al interceptor del cliente con auth.
 *
 * Convención de rutas:
 *   Colecciones → con barra final:  /bookings/, /services/, /reviews/, etc.
 *   Recursos    → sin barra final:  /bookings/{id}, /reviews/{id}/visibilidad
 *   Acciones    → sin barra final:  /bookings/export, /gallery/upload
 *
 * IMPORTANTE: las colecciones llevan barra final para evitar que FastAPI haga
 * un 307 redirect, ya que los clientes HTTP descartan el header Authorization
 * al seguir redirects, lo que provoca un 401 inesperado.
 */

import { createClient, getApiBase, TOKEN_KEY } from "./http/client";

// ── Cliente con interceptor de Authorization ──────────────────────────────────

const adminApi = createClient({ withAuth: true });

// ── Auth ──────────────────────────────────────────────────────────────────────

/** Inicia sesión y devuelve el token JWT (OAuth2 form — application/x-www-form-urlencoded). */
export const loginAdmin = ({ email, password }) =>
  adminApi.post(
    "/auth/login",
    new URLSearchParams({ username: email, password }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

// ── Reservas (admin) ──────────────────────────────────────────────────────────

/** Lista reservas paginadas con filtro opcional de estado. */
export const listBookings = ({ page = 1, size = 20, estado } = {}) =>
  adminApi.get("/bookings/", { params: { page, size, estado } });

/** Actualiza el estado / notas / barbero de una reserva. */
export const updateBooking = (id, data) => adminApi.patch(`/bookings/${id}`, data);

/** Soft-delete de una reserva (fija deleted_at + estado=cancelada). */
export const cancelBooking = (id) => adminApi.delete(`/bookings/${id}`);

/**
 * Dispara la descarga del CSV de reservas en un rango de fechas.
 * Usa fetch nativo para manejar la respuesta como Blob.
 * getApiBase() garantiza que la URL sea correcta tanto en dev como en producción.
 */
export const exportBookingsCSV = async (desde, hasta) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const url   = `${getApiBase()}/bookings/export?desde=${desde}&hasta=${hasta}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}`);
  }

  const blob      = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor    = document.createElement("a");
  anchor.href     = objectUrl;
  anchor.download = `reservas_${desde}_${hasta}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

// ── Servicios (admin) ─────────────────────────────────────────────────────────

/** Lista todos los servicios (incluidos los inactivos) para el panel admin. */
export const listAdminServices = () =>
  adminApi.get("/services/", { params: { solo_activos: false } });

export const createService = (data)     => adminApi.post("/services/", data);
/** El backend expone PUT (reemplazo completo con campos opcionales vía ServiceUpdate). */
export const updateService = (id, data) => adminApi.put(`/services/${id}`, data);
export const deleteService = (id)       => adminApi.delete(`/services/${id}`);

// ── Reseñas (admin) ───────────────────────────────────────────────────────────

/** Lista reseñas paginadas sin filtro de visibilidad (el admin las ve todas). */
export const listAdminReviews = ({ page = 1, size = 50 } = {}) =>
  adminApi.get("/reviews/", { params: { page, size, solo_visibles: false } });

/**
 * Cambia la visibilidad de una reseña.
 * @param {number}  id
 * @param {boolean} visible - nuevo estado deseado
 */
export const toggleReviewVisibility = (id, visible) =>
  adminApi.patch(`/reviews/${id}/visibilidad`, null, { params: { visible } });

export const deleteReview = (id) => adminApi.delete(`/reviews/${id}`);

// ── Galería (admin) ───────────────────────────────────────────────────────────

/** Lista imágenes de la galería (todas, sin filtro). */
export const listGallery = ({ categoria, page = 1, size = 100 } = {}) =>
  adminApi.get("/gallery/", { params: { ...(categoria && { categoria }), page, size } });

/** Elimina una imagen de la galería por ID. */
export const deleteGalleryImage = (id) => adminApi.delete(`/gallery/${id}`);

/**
 * Sube una imagen a la galería con seguimiento de progreso.
 * Usa XMLHttpRequest en lugar de fetch/axios para acceder al evento upload.onprogress.
 * getApiBase() garantiza que la URL sea correcta tanto en dev como en producción.
 *
 * @param {FormData} formData  - debe incluir: file (File), titulo (string|null), categoria (string)
 * @param {(pct: number) => void} [onProgress] - callback con porcentaje 0-100
 * @returns {Promise<GalleryImageOut>}
 */
export const uploadGalleryImage = (formData, onProgress) =>
  new Promise((resolve, reject) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const xhr   = new XMLHttpRequest();

    xhr.open("POST", `${getApiBase()}/gallery/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let detail = `Error ${xhr.status}`;
        try { detail = JSON.parse(xhr.responseText)?.detail ?? detail; } catch { /* noop */ }
        reject(new Error(detail));
      }
    };

    xhr.onerror = () => reject(new Error("Error de red al subir la imagen"));
    xhr.send(formData);
  });

// ── Mensajes de contacto (admin) ──────────────────────────────────────────────

/**
 * Lista mensajes de contacto paginados.
 * @param {{ page?, size?, solo_no_leidos? }} opts
 */
export const listContactMessages = ({ page = 1, size = 50, solo_no_leidos = false } = {}) =>
  adminApi.get("/contact/", { params: { page, size, solo_no_leidos } });

/** Marca un mensaje como leído. */
export const markMessageRead = (id) => adminApi.patch(`/contact/${id}/leido`);

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getStats = () => adminApi.get("/admin/stats");

export default adminApi;
