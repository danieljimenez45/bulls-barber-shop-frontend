/**
 * AuthContext.jsx
 * Contexto de autenticación para el panel de administración.
 * Gestiona el token JWT en localStorage y expone helpers de login/logout.
 */

import { createContext, useContext, useState, useCallback } from "react";
import { loginAdmin } from "../services/adminApi";

const TOKEN_KEY = "bulls_admin_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const isAuthenticated = Boolean(token);

  const login = useCallback(async (email, password) => {
    const { data } = await loginAdmin({ email, password });
    const jwt = data.access_token;
    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
    return jwt;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para consumir el contexto de autenticación desde cualquier componente. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
