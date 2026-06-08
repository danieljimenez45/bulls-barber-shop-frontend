/**
 * Handlers MSW — interceptores HTTP para todos los tests del frontend.
 *
 * Cada handler simula una respuesta realista del backend FastAPI para que los
 * tests de servicios y componentes puedan ejecutarse sin servidor real.
 *
 * Convención de rutas (alineada con FastAPI y con api.js / adminApi.js):
 *   Colecciones → con barra final:  /api/services/, /api/bookings/, etc.
 *   Recursos    → sin barra final:  /api/bookings/:id
 *   Acciones    → sin barra final:  /api/bookings/export, /api/auth/login
 *
 * Formas de respuesta:
 *   Colecciones paginadas → PagedResponse: { items, total, page, size, pages }
 *   Servicios             → array plano (el backend no pagina servicios)
 *   Éxito:  HttpResponse.json({ ... }, { status: 2xx })
 *   Error:  HttpResponse.json({ detail: "..." }, { status: 4xx })
 */

import { http, HttpResponse } from "msw";

// ── Base URL ──────────────────────────────────────────────────────────────────
// En jsdom, window.location es "http://localhost", por lo que las peticiones
// relativas (/api/...) se resuelven como http://localhost/api/...
// MSW v2 necesita URLs absolutas en el entorno Node.
const BASE = "http://localhost";

// ── Datos de ejemplo reutilizables ────────────────────────────────────────────

export const mockService = {
  id: 1,
  nombre: "Corte Clásico",
  precio: 15.0,
  descripcion: "Corte de pelo clásico",
  duracion_minutos: 30,
  categoria: "corte",
  activo: true,
  orden: 0,
};

export const mockBooking = {
  id: 1,
  nombre_cliente: "Juan García",
  telefono: "612345678",
  email: "juan@example.com",
  servicio_id: 1,
  servicio_nombre: "Corte Clásico",
  fecha_hora: "2026-06-10T10:00:00",
  barbero: "Cualquier barbero",
  notas: null,
  estado: "pendiente",
  created_at: "2026-05-25T09:00:00",
  deleted_at: null,
};

export const mockReview = {
  id: 1,
  nombre: "Carlos López",
  comentario: "Excelente servicio",
  valoracion: 5,
  visible: true,
  created_at: "2026-05-25T09:00:00",
};

// imagen_url es el nombre de campo real del backend (GalleryImageOut)
export const mockGalleryImage = {
  id: 1,
  imagen_url: "/uploads/gallery/foto1.jpg",
  titulo: "Corte moderno",
  categoria: "corte",
  created_at: "2026-05-25T09:00:00",
};

export const mockContactMessage = {
  id: 1,
  nombre: "María Ruiz",
  email: "maria@example.com",
  mensaje: "Quiero información sobre precios",
  leido: false,
  created_at: "2026-05-25T09:00:00",
};

export const mockAdminToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxIiwiZXhwIjo5OTk5OTk5OTk5fQ." +
  "dummysignature";

// ── Helper: PagedResponse ─────────────────────────────────────────────────────

/** Envuelve un array de items en la forma paginada del backend. */
function paged(items, { page = 1, size = 20 } = {}) {
  const total = items.length;
  return { items, total, page, size, pages: Math.ceil(total / size) || 1 };
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const params = new URLSearchParams(await request.text());
    if (
      params.get("username") === "admin@test.com" &&
      params.get("password") === "password123"
    ) {
      return HttpResponse.json({ access_token: mockAdminToken, token_type: "bearer" });
    }
    return HttpResponse.json({ detail: "Credenciales incorrectas" }, { status: 401 });
  }),

  // ── Services (público) ─────────────────────────────────────────────────────
  // GET devuelve array plano (no paginado) — el backend no usa PagedResponse aquí
  http.get(`${BASE}/api/services/`, () => {
    return HttpResponse.json([mockService]);
  }),

  http.get(`${BASE}/api/services/:id`, ({ params }) => {
    if (Number(params.id) === mockService.id) {
      return HttpResponse.json(mockService);
    }
    return HttpResponse.json({ detail: "No encontrado" }, { status: 404 });
  }),

  // ── Services (admin) ───────────────────────────────────────────────────────
  http.post(`${BASE}/api/services/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockService, ...body, id: 99 }, { status: 201 });
  }),

  http.put(`${BASE}/api/services/:id`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockService, ...body, id: Number(params.id) });
  }),

  http.delete(`${BASE}/api/services/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Bookings (público) ─────────────────────────────────────────────────────
  http.post(`${BASE}/api/bookings/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockBooking, ...body, id: 10 }, { status: 201 });
  }),

  // Devuelve los slots ocupados del día (la UI deshabilita esas horas)
  http.get(`${BASE}/api/bookings/disponibilidad`, ({ request }) => {
    const url   = new URL(request.url);
    const fecha = url.searchParams.get("fecha");
    if (!fecha) {
      return HttpResponse.json({ detail: "fecha requerida" }, { status: 422 });
    }
    return HttpResponse.json({
      slots_ocupados: [`${fecha}T09:00:00`, `${fecha}T10:00:00`],
      slots_libres: [],
    });
  }),

  // ── Bookings (admin) ───────────────────────────────────────────────────────
  http.get(`${BASE}/api/bookings/`, () => {
    return HttpResponse.json(paged([mockBooking]));
  }),

  http.patch(`${BASE}/api/bookings/:id`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockBooking, ...body, id: Number(params.id) });
  }),

  http.delete(`${BASE}/api/bookings/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/api/bookings/export`, () => {
    return new HttpResponse(
      "id,nombre_cliente,telefono,email,servicio_nombre,fecha_hora,estado\n" +
      "1,Juan García,612345678,juan@example.com,Corte Clásico,2026-06-10T10:00:00,pendiente",
      { headers: { "Content-Type": "text/csv" } },
    );
  }),

  // ── Reviews (público y admin — mismo endpoint, distinto query param) ────────
  // El backend devuelve PagedResponse<ReviewOut> en ambos casos.
  // MSW no puede distinguir por query param en un solo handler, así que
  // devolvemos todas las reseñas; los tests específicos añaden sus propios
  // handlers via server.use(...) cuando necesiten comportamiento diferente.
  http.get(`${BASE}/api/reviews/`, () => {
    return HttpResponse.json(paged([mockReview]));
  }),

  http.post(`${BASE}/api/reviews/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockReview, ...body, id: 20 }, { status: 201 });
  }),

  http.patch(`${BASE}/api/reviews/:id/visibilidad`, ({ params, request }) => {
    const url     = new URL(request.url);
    const visible = url.searchParams.get("visible") === "true";
    return HttpResponse.json({ ...mockReview, id: Number(params.id), visible });
  }),

  http.delete(`${BASE}/api/reviews/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Gallery (público y admin) ──────────────────────────────────────────────
  // Devuelve PagedResponse<GalleryImageOut> con imagen_url (campo real del backend)
  http.get(`${BASE}/api/gallery/`, () => {
    return HttpResponse.json(paged([mockGalleryImage]));
  }),

  http.delete(`${BASE}/api/gallery/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Upload se prueba con XHR mockeado directamente en adminApi.test.js

  // ── Contact (público) ──────────────────────────────────────────────────────
  http.post(`${BASE}/api/contact/`, async () => {
    return HttpResponse.json(
      { ok: true, id: 30, mensaje: "Mensaje recibido" },
      { status: 201 },
    );
  }),

  // ── Contact (admin) ────────────────────────────────────────────────────────
  http.get(`${BASE}/api/contact/`, () => {
    return HttpResponse.json(paged([mockContactMessage]));
  }),

  http.patch(`${BASE}/api/contact/:id/leido`, ({ params }) => {
    return HttpResponse.json({ ...mockContactMessage, id: Number(params.id), leido: true });
  }),

  // ── Stats (admin) ──────────────────────────────────────────────────────────
  http.get(`${BASE}/api/admin/stats`, () => {
    return HttpResponse.json({
      total_reservas: 10,
      reservas_pendientes: 3,
      reservas_confirmadas: 5,
      ingresos_estimados: 150.0,
      total_mensajes: 2,
      mensajes_no_leidos: 1,
    });
  }),

  // ── Health ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/api/health/`, () => {
    return HttpResponse.json({ status: "ok" });
  }),
];
