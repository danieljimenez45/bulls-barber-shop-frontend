/**
 * Tests de la página Booking.jsx
 *
 * Estrategia:
 *   - Mockeamos los módulos externos pesados (framer-motion, react-datepicker,
 *     SeoHead, date-fns) para aislar la lógica del componente.
 *   - Mockeamos las funciones de la capa de servicio (api.js).
 *   - Comprobamos validaciones de formulario, llamadas a la API, toasts de éxito
 *     y manejo de errores.
 *
 * NOTA: los paths de vi.mock se resuelven relativos al fichero de test,
 * por lo que deben apuntar al mismo módulo que el componente importa.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks de módulos externos ─────────────────────────────────────────────────
// Desde src/__tests__/components/, los paths apuntan a la misma ubicación
// que los imports dentro del componente (resueltos ambos por Vite/Vitest).

vi.mock("framer-motion", () => ({
  motion: {
    div:     ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    h1:      ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p:       ({ children, ...props }) => <p {...props}>{children}</p>,
  },
}));

// Stub mínimo del DatePicker que expone un <input type="date"> manejable
vi.mock("react-datepicker", () => ({
  default: ({ onChange, selected, placeholderText }) => (
    <input
      data-testid="datepicker"
      type="date"
      value={selected ? selected.toISOString().split("T")[0] : ""}
      placeholder={placeholderText}
      onChange={(e) => {
        if (e.target.value) onChange(new Date(e.target.value + "T12:00:00"));
        else onChange(null);
      }}
    />
  ),
  registerLocale: vi.fn(),
}));

vi.mock("react-datepicker/dist/react-datepicker.css", () => ({}));

// date-fns/locale → solo necesitamos el objeto es (no lo usamos en el stub)
vi.mock("date-fns/locale", () => ({ es: {} }));

// SeoHead y el CSS del componente
vi.mock("../../components/SeoHead", () => ({ default: () => null }));
vi.mock("../../pages/Booking.css",  () => ({}));

// ── Mock de react-hot-toast ───────────────────────────────────────────────────
const mockToastSuccess = vi.fn();
const mockToastError   = vi.fn();
const mockToast        = vi.fn();
const mockToastPlain   = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: Object.assign((...args) => mockToastPlain(...args), {
    success: (...args) => mockToastSuccess(...args),
    error:   (...args) => mockToastError(...args),
  }),
}));

// ── Mock de api.js ────────────────────────────────────────────────────────────
const mockGetServices       = vi.fn();
const mockGetDisponibilidad = vi.fn();
const mockCreateBooking     = vi.fn();

vi.mock("../../api/services", () => ({
  getServices: (...args) => mockGetServices(...args),
}));

vi.mock("../../api/bookings", () => ({
  getDisponibilidad: (...args) => mockGetDisponibilidad(...args),
  createBooking:     (...args) => mockCreateBooking(...args),
}));

// ── Módulo bajo test ──────────────────────────────────────────────────────────
import Booking from "../../pages/Booking";

// ── Datos de prueba ───────────────────────────────────────────────────────────

const MOCK_SERVICES = [
  { id: 1, nombre: "Corte Clásico",   precio: 15, activo: true },
  { id: 2, nombre: "Barba Completa",  precio: 10, activo: true },
];

const DISPONIBILIDAD_LIBRE = {
  data: { slots_libres: ["10:00", "10:30"], slots_ocupados: [] },
};

// ── Helper ────────────────────────────────────────────────────────────────────

function renderBooking() {
  mockGetServices.mockResolvedValue({ data: MOCK_SERVICES });
  mockGetDisponibilidad.mockResolvedValue(DISPONIBILIDAD_LIBRE);
  return render(<Booking />);
}

/** Los <option> del <select> no son visibles para getByText; usamos role option. */
function waitForServicesLoaded() {
  return waitFor(() => {
    expect(screen.getByRole("option", { name: /Corte Clásico/i })).toBeInTheDocument();
  });
}

async function fillBookingForm({ nombre = "Juan García", telefono = "612345678" } = {}) {
  await userEvent.type(screen.getByLabelText(/^nombre/i), nombre);
  await userEvent.type(screen.getByLabelText(/^teléfono/i), telefono);
  await userEvent.selectOptions(screen.getByLabelText(/^servicio/i), "1");
  fireEvent.change(screen.getByTestId("datepicker"), {
    target: { value: "2026-06-10" },
  });
  await waitFor(() => expect(mockGetDisponibilidad).toHaveBeenCalled());
  // La hora ya no es un <select> sino un botón de la rejilla
  fireEvent.click(screen.getByRole("button", { name: "10:00" }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Booking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Renderizado inicial ─────────────────────────────────────────────────────

  it("carga los servicios al montar", async () => {
    renderBooking();
    await waitFor(() => {
      expect(mockGetServices).toHaveBeenCalledOnce();
    });
  });

  it("muestra los servicios en el selector tras cargar", async () => {
    renderBooking();
    await waitForServicesLoaded();
  });

  it("renderiza el datepicker", async () => {
    renderBooking();
    await waitFor(() => expect(mockGetServices).toHaveBeenCalled());
    expect(screen.getByTestId("datepicker")).toBeInTheDocument();
  });

  it("renderiza el campo de nombre del cliente", async () => {
    renderBooking();
    await waitFor(() =>
      expect(screen.getByLabelText(/^nombre/i)).toBeInTheDocument()
    );
  });

  it("renderiza el campo de teléfono", async () => {
    renderBooking();
    await waitFor(() =>
      expect(screen.getByLabelText(/^teléfono/i)).toBeInTheDocument()
    );
  });

  // ── Validaciones de envío ───────────────────────────────────────────────────

  it("muestra toast de error si se envía sin fecha y hora", async () => {
    renderBooking();
    await waitForServicesLoaded();

    // Enviar el formulario sin seleccionar fecha ni hora
    const form = document.querySelector("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/selecciona fecha y hora/i)
      );
    });
    expect(mockCreateBooking).not.toHaveBeenCalled();
  });

  it("no llama a createBooking sin campos obligatorios (nombre/teléfono)", async () => {
    renderBooking();
    await waitForServicesLoaded();

    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2026-06-10" },
    });
    await waitFor(() => expect(mockGetDisponibilidad).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "10:00" }));

    const form = document.querySelector("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
    expect(mockCreateBooking).not.toHaveBeenCalled();
  });

  // ── Disponibilidad ──────────────────────────────────────────────────────────

  it("consulta la disponibilidad al seleccionar una fecha", async () => {
    renderBooking();
    await waitFor(() => screen.getByTestId("datepicker"));

    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2026-06-10" },
    });

    await waitFor(() => {
      expect(mockGetDisponibilidad).toHaveBeenCalledWith("2026-06-10");
    });
  });

  it("no consulta disponibilidad si no hay fecha seleccionada", async () => {
    renderBooking();
    await waitFor(() => expect(mockGetServices).toHaveBeenCalled());
    // Sin interacción con el datepicker
    expect(mockGetDisponibilidad).not.toHaveBeenCalled();
  });

  // ── Envío exitoso ───────────────────────────────────────────────────────────

  it("llama a createBooking y muestra toast de éxito con formulario completo", async () => {
    renderBooking();
    mockCreateBooking.mockResolvedValue({ data: { id: 99 } });
    await waitForServicesLoaded();
    await fillBookingForm();

    const form = document.querySelector("form");
    await act(async () => { fireEvent.submit(form); });

    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre_cliente: "Juan García",
          telefono: "612345678",
          servicio_id: 1,
          // servicio_nombre ya no se envía — el backend lo obtiene de BD
          fecha_hora: expect.stringMatching(/2026-06-10T10:00:00/),
        })
      );
      // servicio_nombre NO debe estar en el payload (extra="forbid" en el backend)
      expect(mockCreateBooking.mock.calls[0][0]).not.toHaveProperty("servicio_nombre");
      expect(mockToastSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/reserva enviada/i)
      );
    });
  });

  // ── Error 409 (slot ocupado) ────────────────────────────────────────────────

  it("muestra toast de slot ocupado en un error 409", async () => {
    renderBooking();
    const error409 = {
      response: {
        status: 409,
        data: { detail: "Horario ya reservado" },
      },
    };
    mockCreateBooking.mockRejectedValue(error409);
    await waitForServicesLoaded();
    await fillBookingForm({ nombre: "Juan", telefono: "612000000" });

    const form = document.querySelector("form");
    await act(async () => { fireEvent.submit(form); });

    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith(
        "Horario ya reservado",
        expect.objectContaining({ duration: 6000 })
      );
    });
  });

  it("refresca disponibilidad y limpia la hora tras un error 409", async () => {
    renderBooking();
    mockCreateBooking.mockRejectedValue({
      response: { status: 409, data: { detail: "Horario ya reservado" } },
    });
    mockGetDisponibilidad
      .mockResolvedValueOnce(DISPONIBILIDAD_LIBRE)
      .mockResolvedValueOnce({
        data: {
          slots_ocupados: ["2026-06-10T10:00:00"],
          slots_libres: [],
        },
      });
    await waitForServicesLoaded();
    await fillBookingForm();

    const form = document.querySelector("form");
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockGetDisponibilidad.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(mockGetDisponibilidad).toHaveBeenLastCalledWith("2026-06-10");
      // Hora limpiada — ningún slot tiene aria-pressed="true"
      expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument();
    });
    // 10:00 debe quedar deshabilitado tras el refresco de disponibilidad
    expect(screen.getByRole("button", { name: "10:00, ocupado" })).toBeDisabled();
  });

  it("usa el mensaje por defecto en un 409 sin detail", async () => {
    renderBooking();
    mockCreateBooking.mockRejectedValue({ response: { status: 409, data: {} } });
    await waitForServicesLoaded();
    await fillBookingForm();

    fireEvent.submit(document.querySelector("form"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/acaba de reservarse/i),
        expect.objectContaining({ duration: 6000 })
      );
    });
  });

  it("muestra toast genérico en errores distintos de 409", async () => {
    renderBooking();
    mockCreateBooking.mockRejectedValue({ response: { status: 500 } });
    await waitForServicesLoaded();
    await fillBookingForm();

    fireEvent.submit(document.querySelector("form"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/error al crear la reserva/i)
      );
    });
  });

  it("muestra hint de horarios ocupados cuando hay slots ocupados", async () => {
    renderBooking();
    mockGetDisponibilidad.mockResolvedValue({
      data: { slots_libres: ["10:00"], slots_ocupados: ["2026-06-10T10:00:00"] },
    });
    await waitForServicesLoaded();

    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2026-06-10" },
    });

    await waitFor(() => {
      expect(screen.getByText(/horario ocupado/i)).toBeInTheDocument();
    });
  });

  it("limpia la hora elegida si queda ocupada al cambiar la fecha", async () => {
    renderBooking();
    mockGetDisponibilidad
      .mockResolvedValueOnce(DISPONIBILIDAD_LIBRE)
      .mockResolvedValueOnce({
        data: { slots_libres: [], slots_ocupados: ["2026-06-11T10:00:00"] },
      });
    await waitForServicesLoaded();

    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2026-06-10" },
    });
    await waitFor(() => expect(mockGetDisponibilidad).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "10:00" }));

    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2026-06-11" },
    });

    await waitFor(() => {
      expect(mockToastPlain).toHaveBeenCalledWith(
        expect.stringMatching(/acaba de ocuparse/i),
        expect.objectContaining({ icon: "⚠️" })
      );
    });
    // Hora limpiada — ningún slot con aria-pressed="true"
    expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument();
  });

  it("tolera fallo al consultar disponibilidad", async () => {
    renderBooking();
    mockGetDisponibilidad.mockRejectedValue(new Error("red"));
    await waitForServicesLoaded();

    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2026-06-10" },
    });

    await waitFor(() => expect(mockGetDisponibilidad).toHaveBeenCalled());
    // Con error de disponibilidad los slots se muestran todos como libres
    expect(screen.getByRole("button", { name: "10:00" })).not.toBeDisabled();
  });

  it("muestra mensaje cuando no quedan huecos disponibles", async () => {
    renderBooking();
    // 2026-06-10 es miércoles → slots Lun-Vie: mañana 10:00–13:30 + tarde 16:00–20:00
    const todosOcupados = [
      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00",
    ].map((h) => `2026-06-10T${h}:00`);
    mockGetDisponibilidad.mockResolvedValue({
      data: { slots_libres: [], slots_ocupados: todosOcupados },
    });
    await waitForServicesLoaded();

    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2026-06-10" },
    });

    await waitFor(() => {
      expect(screen.getByText(/sin huecos disponibles/i)).toBeInTheDocument();
    });
  });
});
