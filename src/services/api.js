import axios from "axios";

const api = axios.create({
  baseURL: "/api",
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
