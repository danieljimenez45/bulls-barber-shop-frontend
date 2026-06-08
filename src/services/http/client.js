/**
 * client.js — módulo HTTP compartido.
 *
 * Centraliza:
 *   - Construcción de la base URL (dev proxy vs VITE_API_URL en producción)
 *   - Clave de localStorage del token admin
 *   - Resolución de URLs de media (/uploads → prefijo del host de la API)
 *   - Fábrica de clientes Axios con/sin JWT
 *
 * Convención de rutas (alineada con FastAPI):
 *   Colecciones → con barra final:  /services/, /bookings/, /reviews/, etc.
 *   Recursos    → sin barra final:  /bookings/{id}, /reviews/{id}/visibilidad
 *   Acciones    → sin barra final:  /bookings/disponibilidad, /bookings/export
 */

import axios from "axios";

// ── Token ─────────────────────────────────────────────────────────────────────

/** Clave de localStorage donde se guarda el JWT del panel admin. */
export const TOKEN_KEY = "bulls_admin_token";

// ── Base URL ──────────────────────────────────────────────────────────────────

/**
 * Devuelve la base URL de la API.
 *
 * - Desarrollo: Vite proxea /api al backend (vite.config.js → server.proxy).
 * - Producción Docker: el build recibe VITE_API_URL como build-arg
 *   (p.ej. "http://api.bullsbarbershop.es") → se usa como base absoluta.
 */
export function getApiBase() {
  return import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api";
}

/**
 * Devuelve el origen del host de la API (sin el prefijo /api).
 * Necesario para construir URLs absolutas de media en producción.
 *
 * En desarrollo (sin VITE_API_URL) devuelve "" → las URLs relativas funcionan
 * porque el mismo servidor sirve los uploads.
 */
export function getOrigin() {
  return import.meta.env.VITE_API_URL ?? "";
}

// ── URLs de media ─────────────────────────────────────────────────────────────

/**
 * Resuelve una URL de media devuelta por el backend.
 *
 * - `/uploads/...`  → prefija el origen del API cuando hay VITE_API_URL (prod),
 *                     para que `<img src="...">` apunte al servidor correcto.
 * - URLs absolutas (Cloudinary, https://...) → se devuelven tal cual.
 * - null / undefined → devuelve cadena vacía.
 *
 * @param {string|null|undefined} path
 * @returns {string}
 */
export function resolveMediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("/uploads")) {
    return `${getOrigin()}${path}`;
  }
  return path;
}

// ── Fábrica de clientes Axios ─────────────────────────────────────────────────

/**
 * Crea y devuelve un cliente Axios configurado.
 *
 * @param {{ withAuth?: boolean }} opts
 *   - withAuth: true → añade `Authorization: Bearer <token>` desde localStorage
 *                      en cada petición (para rutas admin).
 *
 * @returns {import("axios").AxiosInstance}
 */
export function createClient({ withAuth = false } = {}) {
  const client = axios.create({
    baseURL: getApiBase(),
    headers: { "Content-Type": "application/json" },
  });

  if (withAuth) {
    // El interceptor se ejecuta en cada petición, no al crear el cliente,
    // por lo que siempre lee el token actualizado de localStorage.
    client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  return client;
}
