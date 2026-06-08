/**
 * Tests de AdminLogin.jsx
 *
 * Verifica validación del formulario, errores de login y redirección tras
 * autenticación real vía AuthProvider (loginAdmin mockeado).
 *
 * Dependencias mockeadas:
 *   - react-router-dom (solo useNavigate)
 *   - react-hot-toast
 *   - adminApi.loginAdmin
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestRouter } from "../helpers/TestRouter";
import { AuthProvider } from "../../contexts/AuthContext";
import AdminLogin from "../../pages/admin/AdminLogin";

const { mockNavigate, mockLoginAdmin, mockToastError } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLoginAdmin: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-hot-toast", () => ({
  default: { error: (...args) => mockToastError(...args) },
}));

vi.mock("../../api/auth", () => ({
  loginAdmin: (...args) => mockLoginAdmin(...args),
}));

const VALID_EXP = Math.floor(Date.now() / 1000) + 3600;
const VALID_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  btoa(JSON.stringify({ sub: "1", exp: VALID_EXP })).replace(/=/g, "") +
  ".signature";

function renderLogin() {
  return render(
    <TestRouter>
      <AuthProvider>
        <AdminLogin />
      </AuthProvider>
    </TestRouter>
  );
}

describe("AdminLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginAdmin.mockResolvedValue({
      data: { access_token: VALID_TOKEN, token_type: "bearer" },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza el campo de email", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renderiza el campo de contraseña", () => {
    renderLogin();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it("renderiza el botón de envío", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("muestra el nombre de la marca en el encabezado", () => {
    renderLogin();
    expect(screen.getByText(/bulls/i)).toBeInTheDocument();
  });

  it("redirige a /admin si ya hay sesión válida al montar", () => {
    localStorage.setItem("bulls_admin_token", VALID_TOKEN);
    renderLogin();
    expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true });
  });

  it("muestra error si se envía el formulario con email vacío", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText(/email es obligatorio/i)).toBeInTheDocument();
    });
  });

  it("limpia el error del email al empezar a escribir", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => screen.getByText(/email es obligatorio/i));

    await userEvent.type(screen.getByLabelText(/email/i), "a");

    expect(screen.queryByText(/email es obligatorio/i)).not.toBeInTheDocument();
  });

  it("muestra error si se envía solo con contraseña vacía", async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText(/contraseña es obligatoria/i)).toBeInTheDocument();
    });
  });

  it("muestra error si el email tiene formato inválido", async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "noesuncorreo");
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText(/email válido/i)).toBeInTheDocument();
    });
  });

  it("no llama a loginAdmin si la validación falla", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
    expect(mockLoginAdmin).not.toHaveBeenCalled();
  });

  it("llama a loginAdmin con email y password cuando el formulario es válido", async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "password123");
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockLoginAdmin).toHaveBeenCalledWith({
        email: "admin@test.com",
        password: "password123",
      });
    });
  });

  it("redirige a /admin con replace tras login exitoso", async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "password123");
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true });
    });
  });

  it("muestra toast de error 401 cuando las credenciales son incorrectas", async () => {
    mockLoginAdmin.mockRejectedValueOnce({ response: { status: 401 } });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "wrong");
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/email o contraseña incorrectos/i)
      );
    });
  });

  it("muestra toast de error genérico para errores de red (no 401)", async () => {
    mockLoginAdmin.mockRejectedValueOnce({ response: { status: 500 } });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "pass");
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/error de conexión/i)
      );
    });
  });

  it("deshabilita el botón mientras se procesa el login", async () => {
    mockLoginAdmin.mockReturnValueOnce(new Promise(() => {}));
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "pass");
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /iniciando/i })).toBeDisabled();
    });
  });
});
