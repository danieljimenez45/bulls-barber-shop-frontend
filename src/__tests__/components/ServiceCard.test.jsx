import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ServiceCard from "../../components/ServiceCard";

vi.mock("../../components/ServiceCard.css", () => ({}));
vi.mock("react-icons/fa", () => ({
  FaClock: () => <span data-testid="icon-clock" />,
}));

const SERVICE = {
  id: 1,
  nombre: "Corte clásico",
  precio: 15,
  duracion_minutos: 30,
  categoria: "corte",
  descripcion: "Corte profesional",
};

describe("ServiceCard", () => {
  it("muestra nombre, precio y duración", () => {
    render(<ServiceCard service={SERVICE} />);

    expect(screen.getByText("Corte clásico")).toBeInTheDocument();
    expect(screen.getByText("15 €")).toBeInTheDocument();
    expect(screen.getByText(/30 min/)).toBeInTheDocument();
    expect(screen.getByText("corte")).toBeInTheDocument();
  });

  it("muestra la imagen cuando imagen_url está definida", () => {
    render(
      <ServiceCard
        service={{ ...SERVICE, imagen_url: "/uploads/corte.jpg" }}
      />
    );

    expect(screen.getByRole("img", { name: "Corte clásico" })).toHaveAttribute(
      "src",
      "/uploads/corte.jpg"
    );
  });
});
