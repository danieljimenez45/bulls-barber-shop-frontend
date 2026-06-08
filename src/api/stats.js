/**
 * stats.js — funciones de estadísticas del panel admin.
 */

import { createClient } from "./http/client";

const adminApi = createClient({ withAuth: true });

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getStats = () => adminApi.get("/admin/stats");
