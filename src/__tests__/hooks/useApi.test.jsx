import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useApi } from "../../hooks/useApi";

/**
 * Componente de prueba que monta useApi y expone su estado
 * como nodos del DOM para que los tests puedan inspeccionarlos.
 *
 * - `opts`    → se pasa como tercer argumento a useApi (p.ej. { initialData })
 * - "Refetch" → botón que llama a refetch() para forzar una nueva petición
 */
function ApiProbe({ apiFn, deps = [], opts = {} }) {
  const { data, loading, error, refetch } = useApi(apiFn, deps, opts);
  return (
    <div>
      <span data-testid="loading">{loading ? "yes" : "no"}</span>
      <span data-testid="data">{data ? JSON.stringify(data) : "none"}</span>
      <span data-testid="error">{error ?? "none"}</span>
      <button data-testid="refetch" onClick={refetch}>Refetch</button>
    </div>
  );
}

describe("useApi", () => {
  it("expone los datos cuando la petición tiene éxito", async () => {
    const apiFn = vi.fn().mockResolvedValue({ data: { ok: true } });

    render(<ApiProbe apiFn={apiFn} />);

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("no");
    });
    expect(screen.getByTestId("data").textContent).toBe(JSON.stringify({ ok: true }));
    expect(screen.getByTestId("error").textContent).toBe("none");
  });

  it("expone el mensaje de error cuando la petición falla", async () => {
    const apiFn = vi.fn().mockRejectedValue({
      response: { data: { detail: "Servidor caído" } },
    });

    render(<ApiProbe apiFn={apiFn} />);

    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).toBe("Servidor caído");
    });
    expect(screen.getByTestId("data").textContent).toBe("none");
  });

  it("usa un mensaje genérico si el error no trae detail", async () => {
    const apiFn = vi.fn().mockRejectedValue(new Error("red"));

    render(<ApiProbe apiFn={apiFn} />);

    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).toBe("Error al cargar datos");
    });
  });

  it("vuelve a llamar a la API cuando cambian las dependencias", async () => {
    const apiFn = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockResolvedValueOnce({ data: { id: 2 } });

    const { rerender } = render(<ApiProbe apiFn={apiFn} deps={[1]} />);

    await waitFor(() => {
      expect(screen.getByTestId("data").textContent).toBe(JSON.stringify({ id: 1 }));
    });

    rerender(<ApiProbe apiFn={apiFn} deps={[2]} />);

    await waitFor(() => {
      expect(apiFn).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("data").textContent).toBe(JSON.stringify({ id: 2 }));
    });
  });

  it("no actualiza el estado si el componente se desmonta antes de resolver", async () => {
    let resolveRequest;
    const apiFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRequest = () => resolve({ data: { late: true } });
        })
    );

    const { unmount } = render(<ApiProbe apiFn={apiFn} />);

    expect(screen.getByTestId("loading").textContent).toBe("yes");
    unmount();
    resolveRequest();

    await Promise.resolve();
    expect(apiFn).toHaveBeenCalledOnce();
  });

  // ── refetch ─────────────────────────────────────────────────────────────────

  it("refetch() provoca una nueva llamada a la API sin cambiar las deps", async () => {
    const apiFn = vi
      .fn()
      .mockResolvedValueOnce({ data: { count: 1 } })
      .mockResolvedValueOnce({ data: { count: 2 } });

    render(<ApiProbe apiFn={apiFn} />);

    // Esperar la primera respuesta
    await waitFor(() => {
      expect(screen.getByTestId("data").textContent).toBe(JSON.stringify({ count: 1 }));
    });
    expect(apiFn).toHaveBeenCalledTimes(1);

    // Disparar refetch manualmente
    fireEvent.click(screen.getByTestId("refetch"));

    // Debe resolverse con la segunda respuesta
    await waitFor(() => {
      expect(screen.getByTestId("data").textContent).toBe(JSON.stringify({ count: 2 }));
    });
    expect(apiFn).toHaveBeenCalledTimes(2);
  });

  it("refetch() pone loading=true mientras se recarga", async () => {
    let resolve1;
    let resolve2;
    const apiFn = vi
      .fn()
      .mockImplementationOnce(() => new Promise((r) => { resolve1 = r; }))
      .mockImplementationOnce(() => new Promise((r) => { resolve2 = r; }));

    render(<ApiProbe apiFn={apiFn} />);

    // Primera carga: loading=yes
    expect(screen.getByTestId("loading").textContent).toBe("yes");
    resolve1({ data: { v: 1 } });

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("no")
    );

    // Disparar refetch → loading vuelve a "yes"
    fireEvent.click(screen.getByTestId("refetch"));
    expect(screen.getByTestId("loading").textContent).toBe("yes");

    resolve2({ data: { v: 2 } });
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("no")
    );
    expect(screen.getByTestId("data").textContent).toBe(JSON.stringify({ v: 2 }));
  });

  // ── initialData ──────────────────────────────────────────────────────────────

  it("initialData establece data antes de que resuelva la petición", () => {
    // Promesa que nunca resuelve → estado de carga permanente
    const apiFn = vi.fn(() => new Promise(() => {}));

    render(<ApiProbe apiFn={apiFn} opts={{ initialData: { preloaded: true } }} />);

    // data debe ser initialData incluso con loading=yes
    expect(screen.getByTestId("data").textContent).toBe(
      JSON.stringify({ preloaded: true })
    );
    expect(screen.getByTestId("loading").textContent).toBe("yes");
  });

  it("initialData es reemplazado por la respuesta real al resolver", async () => {
    const apiFn = vi.fn().mockResolvedValue({ data: { fresh: true } });

    render(<ApiProbe apiFn={apiFn} opts={{ initialData: { preloaded: true } }} />);

    // Antes de resolver: initialData visible
    expect(screen.getByTestId("data").textContent).toBe(
      JSON.stringify({ preloaded: true })
    );

    // Después de resolver: datos reales
    await waitFor(() => {
      expect(screen.getByTestId("data").textContent).toBe(
        JSON.stringify({ fresh: true })
      );
    });
  });
});
