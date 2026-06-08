/**
 * reviews.js — funciones de la API de reseñas.
 *
 * Funciones públicas (sin autenticación):
 *   getReviews, createReview
 *
 * Funciones de administración (requieren JWT):
 *   listAdminReviews, toggleReviewVisibility, deleteReview
 */

import { createClient } from "./http/client";

const api      = createClient();
const adminApi = createClient({ withAuth: true });

// ── Público ───────────────────────────────────────────────────────────────────

/** Devuelve PagedResponse<ReviewOut> con solo las reseñas visibles. */
export const getReviews = (params = {}) =>
  api.get("/reviews/", { params: { solo_visibles: true, ...params } });

export const createReview = (data) => api.post("/reviews/", data);

// ── Admin ─────────────────────────────────────────────────────────────────────

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
