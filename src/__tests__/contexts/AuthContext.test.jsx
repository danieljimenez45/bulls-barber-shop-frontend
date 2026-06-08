/**
 * Tests de integración de AuthContext.jsx
 *
 * Verifica:
 *   - Estado inicial: sin token → isAuthenticated = false
 *   - login() con credenciales correctas: guarda token y autentica
 *   - logout(): elimina token y desautentica
 *   - Token expirado en localStorage: se descarta al iniciar
 *   - Token válido en localStorage: se restaura al iniciar
 *   - useAuth() fuera de AuthProvider: lanza error descriptivo
 *
 * loginAdmin se mockea para aislar la lógica del contexto del transporte HTTP.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";

const { mockLoginAdmin } = vi.hoisted(() => ({
  mockLoginAdmin: vi.fn(),
}));

vi.mock("../../api/auth", () => ({
  loginAdmin: (...args) => mockLoginAdmin(...args),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Token JWT válido ~1 h (exp razonable: exp enorme rompe setTimeout en Node). */
const VALID_EXP = Math.floor(Date.now() / 1000) + 3600;
const VALID_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  btoa(JSON.stringify({ sub: "1", exp: VALID_EXP })).replace(/=/g, "") +
  ".signature";

/** Token JWT ya expirado (exp en 1970). */
const EXPIRED_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  btoa(JSON.stringify({ sub: "1", exp: 1 })).replace(/=/g, "") +
  ".signature";

function tokenWithExp(expSeconds) {
  return (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
    btoa(JSON.stringify({ sub: "1", exp: expSeconds })).replace(/=/g, "") +
    ".signature"
  );
}

/**
 * Componente auxiliar que consume el contexto y renderiza el estado.
 * Expone login/logout al DOM para que los tests puedan invocarlos.
 */
function TestConsumer() {
  const { isAuthenticated, tokenPayload, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? "authenticated" : "unauthenticated"}</span>
      <span data-testid="sub">{tokenPayload?.sub ?? "none"}</span>
      <button
        data-testid="btn-login"
        onClick={() => login("admin@test.com", "password123")}
      />
      <button data-testid="btn-logout" onClick={logout} />
    </div>
  );
}

/** Renderiza el Provider + TestConsumer y devuelve las utilidades de testing. */
function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginAdmin.mockResolvedValue({
      data: { access_token: VALID_TOKEN, token_type: "bearer" },
    });
  });

  // ── Estado inicial ──────────────────────────────────────────────────────────

  it("empieza desautenticado cuando localStorage está vacío", () => {
    renderWithAuth();
    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
  });

  it("descarta un token expirado en localStorage al arrancar", () => {
    localStorage.setItem("bulls_admin_token", EXPIRED_TOKEN);
    renderWithAuth();
    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
  });

  it("restaura una sesión válida desde localStorage", () => {
    localStorage.setItem("bulls_admin_token", VALID_TOKEN);
    renderWithAuth();
    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
  });

  it("descarta un token malformado en localStorage", () => {
    localStorage.setItem("bulls_admin_token", "no-es-un-jwt-valido");
    renderWithAuth();
    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
  });

  // ── Login ───────────────────────────────────────────────────────────────────

  it("autentica al usuario tras un login correcto", async () => {
    renderWithAuth();
    await userEvent.click(screen.getByTestId("btn-login"));
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    });
    expect(mockLoginAdmin).toHaveBeenCalledWith({
      email: "admin@test.com",
      password: "password123",
    });
  });

  it("guarda el token en localStorage tras el login", async () => {
    renderWithAuth();
    await userEvent.click(screen.getByTestId("btn-login"));
    await waitFor(() => {
      expect(localStorage.getItem("bulls_admin_token")).toBe(VALID_TOKEN);
    });
  });

  it("expone el tokenPayload con el sub correcto tras el login", async () => {
    renderWithAuth();
    await userEvent.click(screen.getByTestId("btn-login"));
    await waitFor(() => {
      expect(screen.getByTestId("sub").textContent).toBe("1");
    });
  });

  // ── Logout ──────────────────────────────────────────────────────────────────

  it("desautentica al usuario tras logout", async () => {
    localStorage.setItem("bulls_admin_token", VALID_TOKEN);
    renderWithAuth();

    // Confirmar que empieza autenticado
    expect(screen.getByTestId("auth").textContent).toBe("authenticated");

    await userEvent.click(screen.getByTestId("btn-logout"));

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
  });

  it("elimina el token de localStorage tras logout", async () => {
    localStorage.setItem("bulls_admin_token", VALID_TOKEN);
    renderWithAuth();

    await userEvent.click(screen.getByTestId("btn-logout"));

    expect(localStorage.getItem("bulls_admin_token")).toBeNull();
  });

  // ── Auto-logout ─────────────────────────────────────────────────────────────

  it("elimina de localStorage un token inválido al iniciar", () => {
    const exp = Math.floor(Date.now() / 1000) + 10;
    localStorage.setItem("bulls_admin_token", tokenWithExp(exp));
    renderWithAuth();

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    expect(localStorage.getItem("bulls_admin_token")).toBeNull();
  });

  it("limpia la sesión tras login si el token ya está en margen de expiración", async () => {
    const t0 = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(t0 + 120_000);
    const exp = Math.floor(t0 / 1000) + 31;
    mockLoginAdmin.mockResolvedValue({
      data: { access_token: tokenWithExp(exp), token_type: "bearer" },
    });

    renderWithAuth();
    await userEvent.click(screen.getByTestId("btn-login"));

    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    });
    expect(localStorage.getItem("bulls_admin_token")).toBeNull();
    vi.mocked(Date.now).mockRestore();
  });

  it("limpia la sesión si el token devuelto no incluye exp", async () => {
    const tokenSinExp =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      btoa(JSON.stringify({ sub: "1" })).replace(/=/g, "") +
      ".signature";
    mockLoginAdmin.mockResolvedValue({
      data: { access_token: tokenSinExp, token_type: "bearer" },
    });

    renderWithAuth();
    await userEvent.click(screen.getByTestId("btn-login"));

    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    });
    expect(localStorage.getItem("bulls_admin_token")).toBeNull();
  });

  it("reprograma el auto-logout cuando se obtiene un token nuevo", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const expCorto = Math.floor(Date.now() / 1000) + 120;
    const expLargo = Math.floor(Date.now() / 1000) + 7200;
    const tokenCorto = tokenWithExp(expCorto);
    const tokenLargo = tokenWithExp(expLargo);

    mockLoginAdmin.mockResolvedValueOnce({
      data: { access_token: tokenCorto, token_type: "bearer" },
    });

    renderWithAuth();
    await userEvent.click(screen.getByTestId("btn-login"));
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("authenticated");
    });

    mockLoginAdmin.mockResolvedValueOnce({
      data: { access_token: tokenLargo, token_type: "bearer" },
    });
    await userEvent.click(screen.getByTestId("btn-login"));
    await waitFor(() => {
      expect(localStorage.getItem("bulls_admin_token")).toBe(tokenLargo);
    });

    act(() => {
      vi.advanceTimersByTime(3 * 60 * 1000);
    });
    expect(screen.getByTestId("auth").textContent).toBe("authenticated");
  });

  it("cierra la sesión automáticamente cuando el token está a punto de expirar", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const soonExp = Math.floor(Date.now() / 1000) + 31;
    localStorage.setItem("bulls_admin_token", tokenWithExp(soonExp));
    renderWithAuth();

    expect(screen.getByTestId("auth").textContent).toBe("authenticated");

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByTestId("auth").textContent).toBe("unauthenticated");
    expect(localStorage.getItem("bulls_admin_token")).toBeNull();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── useAuth fuera de Provider ────────────────────────────────────────────────

  it("lanza error si useAuth se usa fuera de AuthProvider", () => {
    // Silenciar el error de React en la consola durante este test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer />);
    }).toThrow("useAuth() debe usarse dentro de <AuthProvider>");
    spy.mockRestore();
  });
});
