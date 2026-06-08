/**
 * services.js — funciones de la API del catálogo de servicios.
 *
 * Funciones públicas (sin autenticación):
 *   getServices
 *
 * Funciones de administración (requieren JWT):
 *   listAdminServices, createService, updateService, deleteService
 */

import { createClient } from "./http/client";

const api      = createClient();
const adminApi = createClient({ withAuth: true });

// ── Público ───────────────────────────────────────────────────────────────────

/** Devuelve los servicios activos, con filtro opcional de categoría. */
export const getServices = (categoria) =>
  api.get("/services/", { params: { categoria, solo_activos: true } });

// ── Admin ─────────────────────────────────────────────────────────────────────

/** Lista todos los servicios (incluidos los inactivos) para el panel admin. */
export const listAdminServices = () =>
  adminApi.get("/services/", { params: { solo_activos: false } });

export const createService = (data)     => adminApi.post("/services/", data);

/** El backend expone PUT (reemplazo completo con campos opcionales vía ServiceUpdate). */
export const updateService = (id, data) => adminApi.put(`/services/${id}`, data);

export const deleteService = (id)       => adminApi.delete(`/services/${id}`);
