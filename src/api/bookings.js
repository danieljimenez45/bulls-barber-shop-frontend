/**
 * bookings.js — funciones de la API de reservas.
 *
 * Funciones públicas (sin autenticación):
 *   createBooking, getDisponibilidad
 *
 * Funciones de administración (requieren JWT):
 *   listBookings, updateBooking, cancelBooking, exportBookingsCSV
 */

import { createClient, getApiBase, TOKEN_KEY } from "./http/client";

const api      = createClient();
const adminApi = createClient({ withAuth: true });

// ── Público ───────────────────────────────────────────────────────────────────

/** Crea una reserva nueva (acceso público desde el formulario de la web). */
export const createBooking = (data) => api.post("/bookings/", data);

/** Devuelve los slots ocupados para una fecha "YYYY-MM-DD". */
export const getDisponibilidad = (fecha) =>
  api.get("/bookings/disponibilidad", { params: { fecha } });

// ── Admin ─────────────────────────────────────────────────────────────────────

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
 */
export const exportBookingsCSV = async (desde, hasta) => {
  const token    = localStorage.getItem(TOKEN_KEY);
  const url      = `${getApiBase()}/bookings/export?desde=${desde}&hasta=${hasta}`;
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
