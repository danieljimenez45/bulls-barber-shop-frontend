/**
 * api.js — cliente HTTP público (sin autenticación).
 *
 * Convención de rutas (alineada con FastAPI):
 *   Colecciones → con barra final:  /services/, /bookings/, /reviews/, etc.
 *   Recursos    → sin barra final:  /bookings/{id}
 *   Acciones    → sin barra final:  /bookings/disponibilidad
 *
 * Evitar rutas sin barra en colecciones: FastAPI hace un 307 redirect a la
 * versión con barra, y algunos clientes HTTP descartan headers al seguir
 * redirects (crítico para Authorization en rutas admin).
 */

import { createClient } from "./http/client";

const api = createClient();

// ── Servicios ─────────────────────────────────────────────────────────────────

export const getServices = (categoria) =>
  api.get("/services/", { params: { categoria, solo_activos: true } });

// ── Reservas ──────────────────────────────────────────────────────────────────

export const createBooking = (data) => api.post("/bookings/", data);

/** Devuelve slots_ocupados para un día (formato "YYYY-MM-DD"). */
export const getDisponibilidad = (fecha) =>
  api.get("/bookings/disponibilidad", { params: { fecha } });

// ── Reseñas ───────────────────────────────────────────────────────────────────

/** Devuelve PagedResponse<ReviewOut> con solo las reseñas visibles. */
export const getReviews = (params = {}) =>
  api.get("/reviews/", { params: { solo_visibles: true, ...params } });

export const createReview = (data) => api.post("/reviews/", data);

// ── Galería ───────────────────────────────────────────────────────────────────

/** Devuelve PagedResponse<GalleryImageOut>. */
export const getGallery = (categoria) =>
  api.get("/gallery/", { params: { categoria } });

// ── Contacto ──────────────────────────────────────────────────────────────────

export const sendContact = (data) => api.post("/contact/", data);

export default api;
