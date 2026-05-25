import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestRouter } from "../helpers/TestRouter";
import NotFound from "../../pages/NotFound";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../components/SeoHead", () => ({ default: () => null }));
vi.mock("../../pages/NotFound.css", () => ({}));
vi.mock("react-icons/fa6", () => ({
  FaArrowLeft: () => <span data-testid="icon-arrow" />,
  FaScissors: () => <span data-testid="icon-scissors" />,
}));

describe("NotFound", () => {
  it("muestra el mensaje 404 y enlace al inicio", () => {
    render(
      <TestRouter>
        <NotFound />
      </TestRouter>
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/página no encontrada/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver al inicio/i })).toHaveAttribute("href", "/");
  });
});
