import axios from "axios";

// En dev Vite proxea "/api" al backend (vite.config.js → server.proxy).
// En producción Docker el build recibe VITE_API_URL como build-arg
// (p.ej. "http://localhost:8000") y se usa como base absoluta.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

// ── Servicios ────────────────────────────────────────────────────────────────
export const getServices = (categoria) =>
  api.get("/services", { params: { categoria, solo_activos: true } });

// ── Reservas ─────────────────────────────────────────────────────────────────
export const createBooking = (data) => api.post("/bookings", data);
export const getDisponibilidad = (fecha) =>
  api.get("/bookings/disponibilidad", { params: { fecha } });

// ── Reseñas ──────────────────────────────────────────────────────────────────
export const getReviews = () => api.get("/reviews", { params: { solo_visibles: true } });
export const createReview = (data) => api.post("/reviews", data);

// ── Galería ──────────────────────────────────────────────────────────────────
export const getGallery = (categoria) =>
  api.get("/gallery", { params: { categoria } });

// ── Contacto ─────────────────────────────────────────────────────────────────
export const sendContact = (data) => api.post("/contact", data);

export default api;
