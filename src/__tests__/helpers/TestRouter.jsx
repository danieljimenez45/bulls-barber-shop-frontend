import { MemoryRouter } from "react-router-dom";

/** Flags de React Router v7 — evita warnings en stderr durante los tests. */
export const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

export function TestRouter({ children, initialEntries = ["/"] }) {
  return (
    <MemoryRouter future={ROUTER_FUTURE} initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
}
