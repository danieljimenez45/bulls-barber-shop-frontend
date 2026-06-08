/**
 * Tests unitarios de src/services/adminApi.js
 *
 * Estrategia: mockeamos axios.create para capturar el cliente instanciado y
 * verificar que:
 *   1. El interceptor añade el header Authorization cuando hay token.
 *   2. Cada función llama al método HTTP correcto con URL y params esperados.
 *   3. exportBookingsCSV usa fetch nativo (también mockeado).
 *   4. uploadGalleryImage usa XMLHttpRequest (también mockeado).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks de métodos HTTP — vi.hoisted evita el error de hoisting de vitest ──
const {
  mockGet,
  mockPost,
  mockPatch,
  mockPut,
  mockDelete,
  interceptorCallbackRef,
} = vi.hoisted(() => {
  const interceptorCallbackRef = { current: null };
  return {
    mockGet: vi.fn().mockResolvedValue({ data: [] }),
    mockPost: vi.fn().mockResolvedValue({ data: {} }),
    mockPatch: vi.fn().mockResolvedValue({ data: {} }),
    mockPut: vi.fn().mockResolvedValue({ data: {} }),
    mockDelete: vi.fn().mockResolvedValue({ data: {} }),
    interceptorCallbackRef,
  };
});

vi.mock("axios", () => {
  const mockInstance = {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    put: mockPut,
    delete: mockDelete,
    interceptors: {
      request: {
        use: vi.fn((cb) => {
          interceptorCallbackRef.current = cb;
        }),
      },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
  };
});

// Importar desde los nuevos módulos de dominio
import { loginAdmin }                                     from "../../api/auth";
import { listBookings, updateBooking, cancelBooking, exportBookingsCSV } from "../../api/bookings";
import { listAdminServices, createService, updateService, deleteService } from "../../api/services";
import { listAdminReviews, toggleReviewVisibility, deleteReview }         from "../../api/reviews";
import { listGallery, deleteGalleryImage, uploadGalleryImage }            from "../../api/gallery";
import { listContactMessages, markMessageRead }                           from "../../api/contact";
import { getStats }                                                       from "../../api/stats";

// ─────────────────────────────────────────────────────────────────────────────

describe("adminApi.js — capa de servicio de administración", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── Interceptor de Authorization ────────────────────────────────────────────

  describe("interceptor de Authorization", () => {
    it("añade el header Authorization si hay token en localStorage", () => {
      localStorage.setItem("bulls_admin_token", "mi-token-jwt");
      const config = { headers: {} };
      const result = interceptorCallbackRef.current(config);
      expect(result.headers.Authorization).toBe("Bearer mi-token-jwt");
    });

    it("no modifica los headers si no hay token", () => {
      const config = { headers: {} };
      const result = interceptorCallbackRef.current(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  // ── Auth ────────────────────────────────────────────────────────────────────

  describe("loginAdmin", () => {
    it("llama a POST /auth/login con URLSearchParams y Content-Type form", () => {
      loginAdmin({ email: "admin@test.com", password: "password123" });
      expect(mockPost).toHaveBeenCalledOnce();
      const [url, body, config] = mockPost.mock.calls[0];
      expect(url).toBe("/auth/login");
      expect(body).toBeInstanceOf(URLSearchParams);
      expect(body.get("username")).toBe("admin@test.com");
      expect(body.get("password")).toBe("password123");
      expect(config.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    });
  });

  // ── Reservas ────────────────────────────────────────────────────────────────

  describe("listBookings", () => {
    it("llama a GET /bookings/ con los parámetros por defecto", () => {
      listBookings();
      expect(mockGet).toHaveBeenCalledWith("/bookings/", {
        params: { page: 1, size: 20, estado: undefined },
      });
    });

    it("pasa los parámetros personalizados", () => {
      listBookings({ page: 2, size: 50, estado: "pendiente" });
      expect(mockGet).toHaveBeenCalledWith("/bookings/", {
        params: { page: 2, size: 50, estado: "pendiente" },
      });
    });
  });

  describe("updateBooking", () => {
    it("llama a PATCH /bookings/:id con los datos correctos", () => {
      updateBooking(5, { estado: "confirmada" });
      expect(mockPatch).toHaveBeenCalledWith("/bookings/5", { estado: "confirmada" });
    });
  });

  describe("cancelBooking", () => {
    it("llama a DELETE /bookings/:id", () => {
      cancelBooking(3);
      expect(mockDelete).toHaveBeenCalledWith("/bookings/3");
    });
  });

  // ── exportBookingsCSV (fetch nativo) ────────────────────────────────────────

  describe("exportBookingsCSV", () => {
    it("llama a fetch con la URL y el header Authorization correctos", async () => {
      localStorage.setItem("bulls_admin_token", "token-csv");

      const mockBlob = new Blob(["id,nombre\n1,Juan"], { type: "text/csv" });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
      global.fetch = mockFetch;

      global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/fake");
      global.URL.revokeObjectURL = vi.fn();

      const mockAnchor = { href: "", download: "", click: vi.fn() };
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor);
      vi.spyOn(document.body, "appendChild").mockImplementation(() => {});
      vi.spyOn(document.body, "removeChild").mockImplementation(() => {});

      await exportBookingsCSV("2026-05-01", "2026-05-31");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/bookings/export?desde=2026-05-01&hasta=2026-05-31",
        expect.objectContaining({
          headers: { Authorization: "Bearer token-csv" },
        })
      );
    });

    it("lanza un error si la respuesta no es ok", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("Forbidden"),
      });

      await expect(exportBookingsCSV("2026-05-01", "2026-05-31")).rejects.toThrow("Forbidden");
    });
  });

  // ── Servicios ───────────────────────────────────────────────────────────────

  describe("listAdminServices", () => {
    it("llama a GET /services/ con solo_activos=false", () => {
      listAdminServices();
      expect(mockGet).toHaveBeenCalledWith("/services/", {
        params: { solo_activos: false },
      });
    });
  });

  describe("createService", () => {
    it("llama a POST /services/ con los datos", () => {
      const data = { nombre: "Barba", precio: 10 };
      createService(data);
      expect(mockPost).toHaveBeenCalledWith("/services/", data);
    });
  });

  describe("updateService", () => {
    it("llama a PUT /services/:id con los datos", () => {
      updateService(2, { nombre: "Corte Moderno" });
      expect(mockPut).toHaveBeenCalledWith("/services/2", { nombre: "Corte Moderno" });
    });
  });

  describe("deleteService", () => {
    it("llama a DELETE /services/:id", () => {
      deleteService(2);
      expect(mockDelete).toHaveBeenCalledWith("/services/2");
    });
  });

  // ── Reseñas ─────────────────────────────────────────────────────────────────

  describe("listAdminReviews", () => {
    it("llama a GET /reviews/ con solo_visibles=false", () => {
      listAdminReviews();
      expect(mockGet).toHaveBeenCalledWith("/reviews/", {
        params: { page: 1, size: 50, solo_visibles: false },
      });
    });
  });

  describe("toggleReviewVisibility", () => {
    it("llama a PATCH /reviews/:id/visibilidad con visible=true como query param", () => {
      toggleReviewVisibility(7, true);
      expect(mockPatch).toHaveBeenCalledWith(
        "/reviews/7/visibilidad",
        null,
        { params: { visible: true } }
      );
    });

    it("llama a PATCH con visible=false para ocultar", () => {
      toggleReviewVisibility(7, false);
      expect(mockPatch).toHaveBeenCalledWith(
        "/reviews/7/visibilidad",
        null,
        { params: { visible: false } }
      );
    });
  });

  describe("deleteReview", () => {
    it("llama a DELETE /reviews/:id", () => {
      deleteReview(7);
      expect(mockDelete).toHaveBeenCalledWith("/reviews/7");
    });
  });

  // ── Galería ─────────────────────────────────────────────────────────────────

  describe("listGallery", () => {
    it("llama a GET /gallery/ con los params por defecto", () => {
      listGallery();
      expect(mockGet).toHaveBeenCalledWith("/gallery/", {
        params: { page: 1, size: 100 },
      });
    });

    it("incluye la categoría si se pasa", () => {
      listGallery({ categoria: "corte" });
      expect(mockGet).toHaveBeenCalledWith("/gallery/", {
        params: { categoria: "corte", page: 1, size: 100 },
      });
    });
  });

  describe("deleteGalleryImage", () => {
    it("llama a DELETE /gallery/:id", () => {
      deleteGalleryImage(4);
      expect(mockDelete).toHaveBeenCalledWith("/gallery/4");
    });
  });

  // ── Mensajes de contacto ─────────────────────────────────────────────────────

  describe("listContactMessages", () => {
    it("llama a GET /contact/ con los params por defecto", () => {
      listContactMessages();
      expect(mockGet).toHaveBeenCalledWith("/contact/", {
        params: { page: 1, size: 50, solo_no_leidos: false },
      });
    });

    it("pasa solo_no_leidos=true cuando se solicita", () => {
      listContactMessages({ solo_no_leidos: true });
      expect(mockGet).toHaveBeenCalledWith("/contact/", {
        params: { page: 1, size: 50, solo_no_leidos: true },
      });
    });
  });

  describe("markMessageRead", () => {
    it("llama a PATCH /contact/:id/leido", () => {
      markMessageRead(12);
      expect(mockPatch).toHaveBeenCalledWith("/contact/12/leido");
    });
  });

  // ── Stats ────────────────────────────────────────────────────────────────────

  describe("getStats", () => {
    it("llama a GET /admin/stats", () => {
      getStats();
      expect(mockGet).toHaveBeenCalledWith("/admin/stats");
    });
  });

  // ── uploadGalleryImage (XMLHttpRequest) ─────────────────────────────────────

  describe("uploadGalleryImage", () => {
    let xhrInstances;

    class MockXHR {
      status = 0;
      responseText = "";
      upload = { onprogress: null };
      open = vi.fn();
      setRequestHeader = vi.fn();
      send = vi.fn(function sendMock() {
        this.status = 201;
        this.responseText = JSON.stringify({ id: 9, url: "/foto.jpg" });
        this.onload?.();
      });
    }

    beforeEach(() => {
      xhrInstances = [];
      vi.stubGlobal(
        "XMLHttpRequest",
        vi.fn(() => {
          const xhr = new MockXHR();
          xhrInstances.push(xhr);
          return xhr;
        })
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("sube la imagen y devuelve el JSON de respuesta", async () => {
      localStorage.setItem("bulls_admin_token", "token-upload");
      const formData = new FormData();

      const result = await uploadGalleryImage(formData);

      expect(result).toEqual({ id: 9, url: "/foto.jpg" });
      const xhr = xhrInstances[0];
      expect(xhr.open).toHaveBeenCalledWith("POST", "/api/gallery/upload");
      expect(xhr.setRequestHeader).toHaveBeenCalledWith(
        "Authorization",
        "Bearer token-upload"
      );
      expect(xhr.send).toHaveBeenCalledWith(formData);
    });

    it("notifica el progreso de subida cuando hay callback", async () => {
      vi.stubGlobal(
        "XMLHttpRequest",
        vi.fn(() => {
          const xhr = new MockXHR();
          xhr.send = vi.fn(function progressSend() {
            this.upload.onprogress?.({
              lengthComputable: true,
              loaded: 50,
              total: 100,
            });
            this.status = 201;
            this.responseText = JSON.stringify({ id: 9 });
            this.onload?.();
          });
          xhrInstances.push(xhr);
          return xhr;
        })
      );

      const onProgress = vi.fn();
      await uploadGalleryImage(new FormData(), onProgress);

      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it("rechaza con el detail del servidor en respuestas de error", async () => {
      vi.stubGlobal(
        "XMLHttpRequest",
        vi.fn(() => {
          const xhr = new MockXHR();
          xhr.send = vi.fn(function errorSend() {
            this.status = 400;
            this.responseText = JSON.stringify({ detail: "Archivo no válido" });
            this.onload?.();
          });
          xhrInstances.push(xhr);
          return xhr;
        })
      );

      await expect(uploadGalleryImage(new FormData())).rejects.toThrow(
        "Archivo no válido"
      );
    });

    it("rechaza en error de red", async () => {
      vi.stubGlobal(
        "XMLHttpRequest",
        vi.fn(() => {
          const xhr = new MockXHR();
          xhr.send = vi.fn(function networkErrorSend() {
            this.onerror?.();
          });
          xhrInstances.push(xhr);
          return xhr;
        })
      );

      await expect(uploadGalleryImage(new FormData())).rejects.toThrow(
        /error de red/i
      );
    });
  });
});
