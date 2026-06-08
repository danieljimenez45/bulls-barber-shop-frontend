/**
 * contact.js — funciones de la API de mensajes de contacto.
 *
 * Funciones públicas (sin autenticación):
 *   sendContact
 *
 * Funciones de administración (requieren JWT):
 *   listContactMessages, markMessageRead
 */

import { createClient } from "./http/client";

const api      = createClient();
const adminApi = createClient({ withAuth: true });

// ── Público ───────────────────────────────────────────────────────────────────

export const sendContact = (data) => api.post("/contact/", data);

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * Lista mensajes de contacto paginados.
 * @param {{ page?, size?, solo_no_leidos? }} opts
 */
export const listContactMessages = ({ page = 1, size = 50, solo_no_leidos = false } = {}) =>
  adminApi.get("/contact/", { params: { page, size, solo_no_leidos } });

/** Marca un mensaje como leído. */
export const markMessageRead = (id) => adminApi.patch(`/contact/${id}/leido`);
