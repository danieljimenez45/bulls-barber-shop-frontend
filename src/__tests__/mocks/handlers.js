/**
 * Handlers MSW — interceptores HTTP para todos los tests del frontend.
 *
 * Cada handler simula una respuesta realista del backend FastAPI para que los
 * tests de servicios y componentes puedan ejecutarse sin servidor real.
 *
 * Convención de respuestas:
 *   - Éxito:  HttpResponse.json({ ... }, { status: 2xx })
 *   - Error:  HttpResponse.json({ detail: "..." }, { status: 4xx })
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
  barbero: null,
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

export const mockGalleryImage = {
  id: 1,
  url: "/uploads/foto1.jpg",
  descripcion: "Corte moderno",
  orden: 0,
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

  // ── Services (público) ────────────────────────────────────────────────────
  http.get(`${BASE}/api/services`, () => {
    return HttpResponse.json([mockService]);
  }),

  http.get(`${BASE}/api/services/:id`, ({ params }) => {
    if (Number(params.id) === mockService.id) {
      return HttpResponse.json(mockService);
    }
    return HttpResponse.json({ detail: "No encontrado" }, { status: 404 });
  }),

  // ── Services (admin) ──────────────────────────────────────────────────────
  http.post(`${BASE}/api/services`, async ({ request }) => {
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

  // ── Bookings (público) ────────────────────────────────────────────────────
  http.post(`${BASE}/api/bookings`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockBooking, ...body, id: 10 }, { status: 201 });
  }),

  // Booking.jsx solo consume slots_ocupados (ISO datetime); slots_libres es opcional.
  http.get(`${BASE}/api/bookings/disponibilidad`, ({ request }) => {
    const url = new URL(request.url);
    const fecha = url.searchParams.get("fecha");
    if (!fecha) {
      return HttpResponse.json({ detail: "fecha requerida" }, { status: 422 });
    }
    return HttpResponse.json({
      slots_ocupados: [`${fecha}T09:00:00`, `${fecha}T10:00:00`],
      slots_libres: [],
    });
  }),

  // ── Bookings (admin) — colecciones con barra final (/bookings/) en adminApi ─
  http.get(`${BASE}/api/bookings`, () => {
    return HttpResponse.json({
      items: [mockBooking],
      total: 1,
      page: 1,
      size: 200,
    });
  }),

  http.patch(`${BASE}/api/bookings/:id`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockBooking, ...body, id: Number(params.id) });
  }),

  http.delete(`${BASE}/api/bookings/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/api/bookings/export`, () => {
    return new HttpResponse("id,nombre_cliente\n1,Juan García", {
      headers: { "Content-Type": "text/csv" },
    });
  }),

  // ── Reviews (público) ─────────────────────────────────────────────────────
  http.get(`${BASE}/api/reviews`, () => {
    return HttpResponse.json([mockReview]);
  }),

  http.post(`${BASE}/api/reviews`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockReview, ...body, id: 20 }, { status: 201 });
  }),

  // ── Reviews (admin) ───────────────────────────────────────────────────────
  http.get(`${BASE}/api/admin/reviews`, () => {
    return HttpResponse.json([mockReview, { ...mockReview, id: 2, visible: false }]);
  }),

  http.patch(`${BASE}/api/reviews/:id/visibilidad`, ({ params, request }) => {
    const url = new URL(request.url);
    const visible = url.searchParams.get("visible") === "true";
    return HttpResponse.json({ ...mockReview, id: Number(params.id), visible });
  }),

  http.delete(`${BASE}/api/reviews/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Gallery ───────────────────────────────────────────────────────────────
  http.get(`${BASE}/api/gallery`, () => {
    return HttpResponse.json([mockGalleryImage]);
  }),

  http.delete(`${BASE}/api/gallery/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Contact ───────────────────────────────────────────────────────────────
  http.post(`${BASE}/api/contact`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { ok: true, id: 30, mensaje: "Mensaje recibido" },
      { status: 201 }
    );
  }),

  http.get(`${BASE}/api/contact`, () => {
    return HttpResponse.json([mockContactMessage]);
  }),

  http.patch(`${BASE}/api/contact/:id/leido`, ({ params }) => {
    return HttpResponse.json({ ...mockContactMessage, id: Number(params.id), leido: true });
  }),

  // ── Stats (admin) ─────────────────────────────────────────────────────────
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

  // ── Health ────────────────────────────────────────────────────────────────
  http.get(`${BASE}/api/health`, () => {
    return HttpResponse.json({ status: "ok" });
  }),
];
