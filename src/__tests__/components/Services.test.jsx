import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestRouter } from "../helpers/TestRouter";
import Services from "../../pages/Services";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../components/SeoHead", () => ({ default: () => null }));
vi.mock("../../pages/Services.css", () => ({}));
vi.mock("../../components/ServiceCard", () => ({
  default: ({ service }) => <article data-testid="service-card">{service.nombre}</article>,
}));

const mockGetServices = vi.fn();

vi.mock("../../api/services", () => ({
  getServices: (...args) => mockGetServices(...args),
}));

describe("Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServices.mockResolvedValue({
      data: [
        { id: 1, nombre: "Corte clásico", precio: 15, duracion_minutos: 30, categoria: "corte" },
        { id: 2, nombre: "Barba completa", precio: 15, duracion_minutos: 30, categoria: "barba" },
      ],
    });
  });

  it("muestra los servicios devueltos por la API", async () => {
    render(
      <TestRouter>
        <Services />
      </TestRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Corte clásico")).toBeInTheDocument();
    });
    expect(screen.getByText("Barba completa")).toBeInTheDocument();
  });

  it("filtra por categoría al pulsar una pestaña", async () => {
    render(
      <TestRouter>
        <Services />
      </TestRouter>
    );

    await waitFor(() => screen.getByText("Corte clásico"));

    fireEvent.click(screen.getByRole("button", { name: "Barba" }));

    expect(screen.getByText("Barba completa")).toBeInTheDocument();
    expect(screen.queryByText("Corte clásico")).not.toBeInTheDocument();
  });

  it("muestra el enlace para reservar cita", async () => {
    render(
      <TestRouter>
        <Services />
      </TestRouter>
    );

    await waitFor(() => expect(mockGetServices).toHaveBeenCalled());

    expect(screen.getByRole("link", { name: /reservar cita ahora/i })).toHaveAttribute(
      "href",
      "/reservar"
    );
  });
});
