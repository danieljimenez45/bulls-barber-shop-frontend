/**
 * adminApi.js
 * Cliente Axios para endpoints de administración que requieren JWT.
 * El token se almacena en localStorage bajo la clave "bulls_admin_token".
 */

import axios from "axios";

// ── Cliente base con interceptor de Authorization ─────────────────────────────

const adminApi = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("bulls_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  adminApi.get("/bookings", { params: { page, size, estado } });

/** Actualiza el estado / notas / barbero de una reserva. */
export const updateBooking = (id, data) => adminApi.patch(`/bookings/${id}`, data);

/** Cancela (soft-delete) una reserva. */
export const cancelBooking = (id) => adminApi.delete(`/bookings/${id}`);

/**
 * Dispara la descarga del CSV de reservas en un rango de fechas.
 * Crea dinámicamente un <a> y lo pulsa para que el navegador lo descargue.
 *
 * @param {string} desde - Fecha inicio en formato YYYY-MM-DD
 * @param {string} hasta - Fecha fin en formato YYYY-MM-DD
 */
export const exportBookingsCSV = async (desde, hasta) => {
  const token = localStorage.getItem("bulls_admin_token");
  const url = `/api/bookings/export?desde=${desde}&hasta=${hasta}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `reservas_${desde}_${hasta}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

// ── Servicios (admin) ─────────────────────────────────────────────────────────

/** Lista todos los servicios (incluidos los inactivos) para el panel admin. */
export const listAdminServices = () =>
  adminApi.get("/services", { params: { solo_activos: false } });

export const createService  = (data)      => adminApi.post(`/services`, data);
/** El backend expone PUT (reemplazo completo con campos opcionales vía ServiceUpdate). */
export const updateService  = (id, data)  => adminApi.put(`/services/${id}`, data);
export const deleteService  = (id)        => adminApi.delete(`/services/${id}`);

// ── Reseñas (admin) ───────────────────────────────────────────────────────────

/** Lista reseñas paginadas sin filtro de visibilidad (el admin las ve todas). */
export const listAdminReviews = ({ page = 1, size = 50 } = {}) =>
  adminApi.get("/reviews", { params: { page, size, solo_visibles: false } });

/**
 * Cambia la visibilidad de una reseña.
 * @param {number} id
 * @param {boolean} visible - nuevo estado deseado
 */
export const toggleReviewVisibility = (id, visible) =>
  adminApi.patch(`/reviews/${id}/visibilidad`, null, { params: { visible } });

export const deleteReview = (id) => adminApi.delete(`/reviews/${id}`);

// ── Galería (admin) ───────────────────────────────────────────────────────────

/** Lista imágenes de la galería (todas, sin filtro de visibilidad). */
export const listGallery = ({ categoria, page = 1, size = 100 } = {}) =>
  adminApi.get("/gallery", { params: { ...(categoria && { categoria }), page, size } });

/** Elimina una imagen de la galería por ID. */
export const deleteGalleryImage = (id) => adminApi.delete(`/gallery/${id}`);

/**
 * Sube una imagen a la galería con seguimiento de progreso.
 * Usa XMLHttpRequest en lugar de fetch/axios para acceder al evento upload.onprogress.
 *
 * @param {FormData} formData - debe incluir: file (File), titulo (string|null), categoria (string)
 * @param {(pct: number) => void} [onProgress] - callback con porcentaje 0-100
 * @returns {Promise<GalleryImageOut>} objeto imagen creado
 */
export const uploadGalleryImage = (formData, onProgress) =>
  new Promise((resolve, reject) => {
    const token = localStorage.getItem("bulls_admin_token");
    const xhr   = new XMLHttpRequest();

    xhr.open("POST", "/api/gallery/upload");
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

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getStats = () => adminApi.get("/admin/stats");

export default adminApi;
