/**
 * ProtectedRoute.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Guard de rutas para el panel de administración.
 *
 * Si el usuario NO está autenticado (no hay token o expiró), redirige a
 * /admin/login preservando la ruta intentada en `state.from` para poder
 * volver a ella tras el login.
 *
 * Uso:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="reservas" element={<AdminReservas />} />
 *   </Route>
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Guardamos la ruta actual para redirigir después del login
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Autenticado → renderizar la ruta hija
  return <Outlet />;
}
