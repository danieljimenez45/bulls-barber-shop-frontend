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

export const listAdminServices = () => adminApi.get("/services", { params: { include_inactive: true } });
export const createService = (data) => adminApi.post("/services", data);
export const updateService = (id, data) => adminApi.patch(`/services/${id}`, data);
export const deleteService = (id) => adminApi.delete(`/services/${id}`);

// ── Reseñas (admin) ───────────────────────────────────────────────────────────

export const listAdminReviews = ({ page = 1, size = 20 } = {}) =>
  adminApi.get("/reviews", { params: { page, size } });
export const toggleReviewVisibility = (id) => adminApi.patch(`/reviews/${id}/visibilidad`);
export const deleteReview = (id) => adminApi.delete(`/reviews/${id}`);

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getStats = () => adminApi.get("/admin/stats");

export default adminApi;
