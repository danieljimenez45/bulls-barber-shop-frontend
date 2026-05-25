import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useApi } from "../../hooks/useApi";

function ApiProbe({ apiFn, deps = [] }) {
  const { data, loading, error } = useApi(apiFn, deps);
  return (
    <div>
      <span data-testid="loading">{loading ? "yes" : "no"}</span>
      <span data-testid="data">{data ? JSON.stringify(data) : "none"}</span>
      <span data-testid="error">{error ?? "none"}</span>
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
});
