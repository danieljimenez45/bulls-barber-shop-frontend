/**
 * Tests unitarios de src/services/api.js
 *
 * Estrategia: mockeamos axios.create para capturar el cliente instanciado y
 * verificar que cada función de la capa pública llama al método HTTP correcto
 * con la URL y los parámetros esperados.
 *
 * No hacemos peticiones reales: lo que testamos aquí es el "contrato" de la
 * capa de servicio (rutas, params, headers), no el backend.
 *
 * Convención de rutas verificada:
 *   Colecciones → barra final:  /services/, /bookings/, /reviews/, /gallery/, /contact/
 *   Acciones    → sin barra:    /bookings/disponibilidad
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock de axios — vi.hoisted evita el error de hoisting de vitest ───────────
const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn().mockResolvedValue({ data: [] }),
  mockPost: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock("axios", () => {
  const mockInstance = {
    get: mockGet,
    post: mockPost,
    interceptors: {
      request:  { use: vi.fn() },
      response: { use: vi.fn() },   // necesario tras añadir el interceptor 401 en createClient
    },
  };
  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
  };
});

// Importar DESPUÉS del mock (desde los nuevos módulos de dominio)
import { createBooking, getDisponibilidad } from "../../api/bookings";
import { getServices }                       from "../../api/services";
import { getReviews, createReview }          from "../../api/reviews";
import { getGallery }                        from "../../api/gallery";
import { sendContact }                       from "../../api/contact";

// ─────────────────────────────────────────────────────────────────────────────

describe("api.js — capa de servicio pública", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getServices ─────────────────────────────────────────────────────────────

  describe("getServices", () => {
    it("llama a GET /services/ con solo_activos=true", () => {
      getServices();
      expect(mockGet).toHaveBeenCalledWith("/services/", {
        params: { categoria: undefined, solo_activos: true },
      });
    });

    it("pasa el filtro de categoría cuando se proporciona", () => {
      getServices("corte");
      expect(mockGet).toHaveBeenCalledWith("/services/", {
        params: { categoria: "corte", solo_activos: true },
      });
    });

    it("devuelve la promesa de axios", () => {
      const result = getServices();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // ── createBooking ───────────────────────────────────────────────────────────

  describe("createBooking", () => {
    const payload = {
      nombre_cliente: "Juan García",
      telefono: "612345678",
      email: "juan@example.com",
      servicio_id: 1,
      fecha_hora: "2026-06-10T10:00:00",
    };

    it("llama a POST /bookings/ con el payload correcto", () => {
      createBooking(payload);
      expect(mockPost).toHaveBeenCalledWith("/bookings/", payload);
    });

    it("devuelve la promesa de axios", () => {
      const result = createBooking(payload);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // ── getDisponibilidad ───────────────────────────────────────────────────────

  describe("getDisponibilidad", () => {
    it("llama a GET /bookings/disponibilidad con el param fecha (sin barra final — acción)", () => {
      getDisponibilidad("2026-06-10");
      expect(mockGet).toHaveBeenCalledWith("/bookings/disponibilidad", {
        params: { fecha: "2026-06-10" },
      });
    });
  });

  // ── getReviews ──────────────────────────────────────────────────────────────

  describe("getReviews", () => {
    it("llama a GET /reviews/ con solo_visibles=true", () => {
      getReviews();
      expect(mockGet).toHaveBeenCalledWith("/reviews/", {
        params: { solo_visibles: true },
      });
    });

    it("permite pasar params adicionales (page, size)", () => {
      getReviews({ page: 1, size: 3 });
      expect(mockGet).toHaveBeenCalledWith("/reviews/", {
        params: { solo_visibles: true, page: 1, size: 3 },
      });
    });
  });

  // ── createReview ────────────────────────────────────────────────────────────

  describe("createReview", () => {
    it("llama a POST /reviews/ con los datos correctos", () => {
      const data = { nombre: "Carlos", comentario: "Muy bien", valoracion: 5 };
      createReview(data);
      expect(mockPost).toHaveBeenCalledWith("/reviews/", data);
    });
  });

  // ── getGallery ──────────────────────────────────────────────────────────────

  describe("getGallery", () => {
    it("llama a GET /gallery/ sin categoría", () => {
      getGallery();
      expect(mockGet).toHaveBeenCalledWith("/gallery/", {
        params: { categoria: undefined },
      });
    });

    it("pasa la categoría cuando se proporciona", () => {
      getGallery("barba");
      expect(mockGet).toHaveBeenCalledWith("/gallery/", {
        params: { categoria: "barba" },
      });
    });
  });

  // ── sendContact ─────────────────────────────────────────────────────────────

  describe("sendContact", () => {
    it("llama a POST /contact/ con el mensaje", () => {
      const data = { nombre: "Ana", email: "ana@example.com", mensaje: "Hola" };
      sendContact(data);
      expect(mockPost).toHaveBeenCalledWith("/contact/", data);
    });
  });
});
