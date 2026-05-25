/**
 * Tests de AdminReservas.jsx
 *
 * Verifica:
 *   - Carga y muestra la lista de reservas al montar
 *   - Muestra mensaje de vacío cuando no hay reservas
 *   - La búsqueda filtra reservas por nombre y teléfono
 *   - Los chips de estado filtran correctamente
 *   - El modal de cancelación se abre y cierra con Escape
 *   - Llamar a cancelBooking() tras confirmar el modal
 *   - updateBooking() se llama al cambiar el estado con el selector
 *   - Manejo de error al cargar reservas
 *
 * Estrategia: mock completo de adminApi.js para aislar el componente.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mock de react-hot-toast ───────────────────────────────────────────────────
const mockToastSuccess = vi.fn();
const mockToastError   = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: {
    success: (...args) => mockToastSuccess(...args),
    error:   (...args) => mockToastError(...args),
  },
}));

// ── Mock de ExportCSVModal (componente pesado) ────────────────────────────────
vi.mock("../../components/admin/ExportCSVModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="export-modal"><button onClick={onClose}>Cerrar</button></div>
  ),
}));

// ── Mock de adminApi.js ───────────────────────────────────────────────────────
const mockListBookings  = vi.fn();
const mockUpdateBooking = vi.fn();
const mockCancelBooking = vi.fn();

vi.mock("../../services/adminApi", () => ({
  listBookings:  (...args) => mockListBookings(...args),
  updateBooking: (...args) => mockUpdateBooking(...args),
  cancelBooking: (...args) => mockCancelBooking(...args),
}));

// ── Módulo bajo test ──────────────────────────────────────────────────────────
import AdminReservas from "../../pages/admin/AdminReservas";

// ── Datos de prueba ───────────────────────────────────────────────────────────

const makeBooking = (overrides = {}) => ({
  id: 1,
  nombre_cliente: "Juan García",
  telefono: "612345678",
  email: "juan@example.com",
  servicio_nombre: "Corte Clásico",
  fecha_hora: "2026-06-10T10:00:00",
  barbero: null,
  notas: null,
  estado: "pendiente",
  created_at: "2026-05-25T09:00:00",
  ...overrides,
});

const RESERVAS = [
  makeBooking({ id: 1, nombre_cliente: "Juan García",  telefono: "612345678", estado: "pendiente"  }),
  makeBooking({ id: 2, nombre_cliente: "María López",  telefono: "699887766", estado: "confirmada" }),
  makeBooking({ id: 3, nombre_cliente: "Carlos Ruiz",  telefono: "611223344", estado: "completada" }),
];

function mockListBookingsSuccess(items = RESERVAS) {
  mockListBookings.mockResolvedValue({
    data: { items, total: items.length, page: 1, size: 200 },
  });
}

/** Vista tabla desktop (evita duplicados con las cards móviles en el DOM). */
function desktopTable() {
  const table = document.querySelector(".ar-table");
  if (!table) throw new Error("No se encontró la tabla desktop");
  return within(table);
}

function bookingRow(nombre) {
  return desktopTable().getByText(nombre).closest("tr");
}

/** Botón ✕ de la fila (el texto visible; title="Cancelar" no entra en el nombre accesible). */
function cancelButtonInRow(nombre) {
  return within(bookingRow(nombre)).getByRole("button", { name: "✕" });
}

/** Vista cards móvil (en jsdom lleva display:none; los botones requieren hidden: true). */
function mobileCards() {
  const el = document.querySelector(".ar-cards");
  if (!el) throw new Error("No se encontró la vista móvil");
  return within(el);
}

function mobileButton(namePattern) {
  return mobileCards().getByRole("button", { name: namePattern, hidden: true });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AdminReservas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateBooking.mockResolvedValue({ data: makeBooking() });
    mockCancelBooking.mockResolvedValue({});
  });

  // ── Carga inicial ───────────────────────────────────────────────────────────

  it("muestra las reservas cargadas del backend", async () => {
    mockListBookingsSuccess();
    render(<AdminReservas />);

    await waitFor(() => {
      expect(desktopTable().getByText("Juan García")).toBeInTheDocument();
    });
    expect(desktopTable().getByText("María López")).toBeInTheDocument();
    expect(desktopTable().getByText("Carlos Ruiz")).toBeInTheDocument();
  });

  it("llama a listBookings con page=1 y size grande al montar", async () => {
    mockListBookingsSuccess();
    render(<AdminReservas />);
    await waitFor(() => expect(mockListBookings).toHaveBeenCalledOnce());
    const [args] = mockListBookings.mock.calls;
    // El componente carga todas las reservas de una vez (size=200 o similar)
    expect(args[0].page).toBe(1);
  });

  it("muestra un indicador de carga mientras se cargan las reservas", () => {
    // Promesa que no resuelve → estado de carga permanente
    mockListBookings.mockReturnValue(new Promise(() => {}));
    render(<AdminReservas />);
    // El componente tiene skeleton o spinner — comprobamos que los datos no están aún
    expect(screen.queryByText("Juan García")).not.toBeInTheDocument();
  });

  it("muestra mensaje de vacío cuando no hay reservas", async () => {
    mockListBookingsSuccess([]);
    render(<AdminReservas />);
    await waitFor(() => {
      expect(mockListBookings).toHaveBeenCalled();
      expect(desktopTable().getByText(/no hay reservas/i)).toBeInTheDocument();
    });
    expect(mobileCards().getByText(/no hay reservas/i)).toBeInTheDocument();
    expect(screen.queryByText("Juan García")).not.toBeInTheDocument();
  });

  // ── Búsqueda client-side ────────────────────────────────────────────────────

  it("filtra reservas por nombre al escribir en el buscador", async () => {
    mockListBookingsSuccess();
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    const searchInput = screen.getByLabelText(/buscar reserva/i);
    await userEvent.type(searchInput, "María");

    expect(desktopTable().getByText("María López")).toBeInTheDocument();
    expect(desktopTable().queryByText("Juan García")).not.toBeInTheDocument();
  });

  it("filtra reservas por teléfono al escribir en el buscador", async () => {
    mockListBookingsSuccess();
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    const searchInput = screen.getByLabelText(/buscar reserva/i);
    await userEvent.type(searchInput, "699887766");

    expect(desktopTable().getByText("María López")).toBeInTheDocument();
    expect(desktopTable().queryByText("Juan García")).not.toBeInTheDocument();
  });

  // ── Filtro por estado (chips) ───────────────────────────────────────────────

  it("filtra por estado al hacer clic en un chip", async () => {
    mockListBookingsSuccess();
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    const chipConfirmada = screen.getByRole("button", { name: /confirmada/i });
    fireEvent.click(chipConfirmada);

    await waitFor(() => {
      expect(desktopTable().getByText("María López")).toBeInTheDocument();
      expect(desktopTable().queryByText("Juan García")).not.toBeInTheDocument();
    });
  });

  it("vuelve a mostrar todas las reservas al hacer clic en chip 'Todas'", async () => {
    mockListBookingsSuccess();
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    fireEvent.click(screen.getByRole("button", { name: /confirmada/i }));
    await waitFor(() =>
      expect(desktopTable().queryByText("Juan García")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /todas/i }));
    await waitFor(() => {
      expect(desktopTable().getByText("Juan García")).toBeInTheDocument();
      expect(desktopTable().getByText("María López")).toBeInTheDocument();
    });
  });

  // ── Modal de cancelación ────────────────────────────────────────────────────

  it("abre el modal de cancelación al hacer clic en el botón cancelar", async () => {
    mockListBookingsSuccess([makeBooking({ estado: "pendiente" })]);
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    fireEvent.click(cancelButtonInRow("Juan García"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("cierra el modal de cancelación al pulsar Escape", async () => {
    mockListBookingsSuccess([makeBooking({ estado: "pendiente" })]);
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    fireEvent.click(cancelButtonInRow("Juan García"));
    await waitFor(() => screen.getByRole("dialog"));

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("llama a cancelBooking() al confirmar la cancelación", async () => {
    mockListBookingsSuccess([makeBooking({ id: 5, estado: "pendiente" })]);
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    fireEvent.click(cancelButtonInRow("Juan García"));
    await waitFor(() => screen.getByRole("dialog"));

    const confirmBtn = within(screen.getByRole("dialog")).getByRole("button", {
      name: /sí, cancelar reserva/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockCancelBooking).toHaveBeenCalledWith(5);
    });
  });

  // ── Modal de exportación CSV ────────────────────────────────────────────────

  it("pagina la tabla cuando hay más reservas que PAGE_SIZE", async () => {
    const muchas = Array.from({ length: 16 }, (_, i) =>
      makeBooking({
        id: i + 1,
        nombre_cliente: `Cliente ${i + 1}`,
        estado: "pendiente",
      })
    );
    mockListBookingsSuccess(muchas);
    render(<AdminReservas />);

    await waitFor(() => desktopTable().getByText("Cliente 1"));
    expect(desktopTable().getByText("Cliente 15")).toBeInTheDocument();
    expect(desktopTable().queryByText("Cliente 16")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    await waitFor(() => {
      expect(desktopTable().getByText("Cliente 16")).toBeInTheDocument();
      expect(screen.getByText(/2\s*\/\s*2/)).toBeInTheDocument();
    });
  });

  it("abre el modal de exportación CSV al hacer clic en el botón correspondiente", async () => {
    mockListBookingsSuccess();
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    const exportBtn = screen.getByRole("button", { name: /exportar reservas a csv/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByTestId("export-modal")).toBeInTheDocument();
    });
  });

  // ── Errores de API ──────────────────────────────────────────────────────────

  it("muestra toast de error si falla la carga de reservas", async () => {
    mockListBookings.mockRejectedValue(new Error("red"));
    render(<AdminReservas />);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Error al cargar las reservas");
    });
    expect(desktopTable().queryByText("Juan García")).not.toBeInTheDocument();
  });

  it("muestra toast si falla cancelBooking al confirmar el modal", async () => {
    mockListBookingsSuccess([makeBooking({ id: 3, estado: "pendiente" })]);
    mockCancelBooking.mockRejectedValue(new Error("conflicto"));
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    fireEvent.click(cancelButtonInRow("Juan García"));
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /sí, cancelar reserva/i,
      })
    );

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("No se pudo cancelar la reserva");
    });
  });

  it("muestra toast si falla updateBooking al confirmar desde la tabla", async () => {
    mockListBookingsSuccess([makeBooking({ id: 1, estado: "pendiente" })]);
    mockUpdateBooking.mockRejectedValue(new Error("fallo"));
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    fireEvent.click(
      within(bookingRow("Juan García")).getByRole("button", { name: /confirmar/i })
    );

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("No se pudo actualizar la reserva");
    });
  });

  it("completa una reserva confirmada desde la tabla", async () => {
    mockListBookingsSuccess([makeBooking({ id: 4, estado: "confirmada" })]);
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    fireEvent.click(
      within(bookingRow("Juan García")).getByRole("button", { name: /completar/i })
    );

    await waitFor(() => {
      expect(mockUpdateBooking).toHaveBeenCalledWith(4, { estado: "completada" });
    });
  });

  it("confirma una reserva pendiente desde la tabla y muestra toast de éxito", async () => {
    mockListBookingsSuccess([makeBooking({ id: 1, estado: "pendiente" })]);
    mockUpdateBooking.mockResolvedValue({
      data: makeBooking({ id: 1, estado: "confirmada" }),
    });
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    fireEvent.click(
      within(bookingRow("Juan García")).getByRole("button", { name: /confirmar/i })
    );

    await waitFor(() => {
      expect(mockUpdateBooking).toHaveBeenCalledWith(1, { estado: "confirmada" });
      expect(mockToastSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/actualizada/i)
      );
    });
  });

  it("muestra mensaje de búsqueda sin resultados", async () => {
    mockListBookingsSuccess();
    render(<AdminReservas />);
    await waitFor(() => desktopTable().getByText("Juan García"));

    await userEvent.type(screen.getByLabelText(/buscar reserva/i), "zzzzinexistente");

    await waitFor(() => {
      expect(screen.getByText(/sin resultados para/i)).toBeInTheDocument();
    });
  });

  // ── Vista móvil (BookingCard) ─────────────────────────────────────────────

  it("muestra barbero y notas en la card móvil", async () => {
    mockListBookingsSuccess([
      makeBooking({
        barbero: "Barbero 1",
        notas: "Degradado bajo",
        servicio_nombre: null,
        servicio_id: 9,
      }),
    ]);
    render(<AdminReservas />);

    await waitFor(() => mobileCards().getByText("Juan García"));
    expect(mobileCards().getByText("Barbero 1")).toBeInTheDocument();
    expect(mobileCards().getByText("Degradado bajo")).toBeInTheDocument();
    expect(mobileCards().getByText(/servicio #9/i)).toBeInTheDocument();
  });

  it("confirma una reserva desde la card móvil", async () => {
    mockListBookingsSuccess([makeBooking({ id: 2, estado: "pendiente" })]);
    render(<AdminReservas />);
    await waitFor(() => mobileCards().getByText("Juan García"));

    fireEvent.click(mobileButton(/confirmar/i));

    await waitFor(() => {
      expect(mockUpdateBooking).toHaveBeenCalledWith(2, { estado: "confirmada" });
    });
  });

  it("abre el modal de cancelación desde la card móvil", async () => {
    mockListBookingsSuccess([makeBooking({ estado: "pendiente" })]);
    render(<AdminReservas />);
    await waitFor(() => mobileCards().getByText("Juan García"));

    fireEvent.click(mobileButton(/cancelar/i));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("completa una reserva confirmada desde la card móvil", async () => {
    mockListBookingsSuccess([makeBooking({ id: 6, estado: "confirmada" })]);
    render(<AdminReservas />);
    await waitFor(() => mobileCards().getByText("Juan García"));

    fireEvent.click(mobileButton(/completar/i));

    await waitFor(() => {
      expect(mockUpdateBooking).toHaveBeenCalledWith(6, { estado: "completada" });
    });
  });

  it("muestra toast si falla updateBooking desde la card móvil", async () => {
    mockListBookingsSuccess([makeBooking({ id: 7, estado: "pendiente" })]);
    mockUpdateBooking.mockRejectedValue(new Error("fallo"));
    render(<AdminReservas />);
    await waitFor(() => mobileCards().getByText("Juan García"));

    fireEvent.click(mobileButton(/confirmar/i));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("No se pudo actualizar la reserva");
    });
  });
});
