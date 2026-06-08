/**
 * auth.js — funciones de autenticación del panel admin.
 *
 * loginAdmin usa OAuth2 con application/x-www-form-urlencoded
 * (el backend espera los campos "username" y "password").
 */

import { createClient } from "./http/client";

const adminApi = createClient({ withAuth: true });

// ── Admin ─────────────────────────────────────────────────────────────────────

/** Inicia sesión y devuelve el token JWT (OAuth2 form). */
export const loginAdmin = ({ email, password }) =>
  adminApi.post(
    "/auth/login",
    new URLSearchParams({ username: email, password }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
