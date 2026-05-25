import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { TestRouter } from "../helpers/TestRouter";
import ProtectedRoute from "../../components/admin/ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function LoginProbe() {
  const loc = useLocation();
  return (
    <span data-testid="from-path">{loc.state?.from?.pathname ?? "none"}</span>
  );
}

function renderAt(path) {
  return render(
    <TestRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/login" element={<LoginProbe />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route path="reservas" element={<div>Panel reservas</div>} />
        </Route>
      </Routes>
    </TestRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirige a /admin/login si no hay sesión", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    renderAt("/admin/reservas");
    expect(screen.getByTestId("from-path")).toBeInTheDocument();
    expect(screen.queryByText("Panel reservas")).not.toBeInTheDocument();
  });

  it("preserva la ruta intentada en state.from al redirigir", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    renderAt("/admin/reservas");
    expect(screen.getByTestId("from-path").textContent).toBe("/admin/reservas");
  });

  it("renderiza la ruta hija si el usuario está autenticado", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    renderAt("/admin/reservas");
    expect(screen.getByText("Panel reservas")).toBeInTheDocument();
  });
});
