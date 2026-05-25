/**
 * AuthContext.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Contexto global de autenticación para el panel de administración.
 *
 * Responsabilidades:
 *  - Leer/escribir el JWT en localStorage
 *  - Decodificar el payload del token (sub, exp) sin librería externa
 *  - Comprobar expiración y lanzar auto-logout silencioso
 *  - Exponer { isAuthenticated, admin, login, logout } a toda la app
 *
 * El interceptor de Axios está en adminApi.js para mantener la separación
 * de responsabilidades: el contexto gestiona el estado, la capa de API
 * gestiona el transporte HTTP.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { loginAdmin } from "../services/adminApi";

// ── Constantes ────────────────────────────────────────────────────────────────

const TOKEN_KEY = "bulls_admin_token";

/**
 * Margen de seguridad en segundos: el auto-logout se dispara este tiempo
 * ANTES de que el JWT expire, evitando llamadas API con token ya caducado.
 */
const EXPIRY_MARGIN_SECONDS = 30;

// ── Helpers JWT ───────────────────────────────────────────────────────────────

/**
 * Decodifica el payload de un JWT sin validar la firma.
 * Solo se usa para leer `sub` y `exp` en el cliente — la validación
 * real siempre ocurre en el backend.
 *
 * @param {string} token
 * @returns {{ sub: string, exp: number } | null}
 */
function decodeJwtPayload(token) {
  try {
    // Un JWT tiene la forma: header.payload.signature
    const base64Payload = token.split(".")[1];

    // Base64-URL → Base64 estándar
    const base64 = base64Payload.replace(/-/g, "+").replace(/_/g, "/");

    // Decodificar y parsear
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );

    return JSON.parse(jsonStr);
  } catch {
    // Token malformado
    return null;
  }
}

/**
 * Comprueba si el token está activo (existe y no ha expirado).
 *
 * @param {string | null} token
 * @returns {boolean}
 */
function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;

  const nowSeconds = Date.now() / 1000;
  return payload.exp > nowSeconds + EXPIRY_MARGIN_SECONDS;
}

/**
 * Calcula los milisegundos que faltan para que el token expire
 * (ya descontando el margen de seguridad).
 *
 * @param {string} token
 * @returns {number} ms hasta el auto-logout; 0 si ya expiró
 */
function msUntilExpiry(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return 0;

  const expiryMs = (payload.exp - EXPIRY_MARGIN_SECONDS) * 1000;
  return Math.max(0, expiryMs - Date.now());
}

// ── Contexto ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * AuthProvider
 * Envuelve la aplicación y proporciona el estado de autenticación.
 * Debe colocarse cerca de la raíz del árbol de componentes.
 */
export function AuthProvider({ children }) {
  // Cargamos el token inicial solo si sigue siendo válido
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!isTokenValid(stored)) {
      if (stored) localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return stored;
  });

  // Ref para el timer de auto-logout (evita memory leaks al desmontar)
  const logoutTimerRef = useRef(null);

  // ── Auto-logout ────────────────────────────────────────────────────────────

  /**
   * Limpia el estado de autenticación, elimina el token del storage
   * y cancela cualquier timer pendiente.
   */
  const clearAuth = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  /**
   * Programa un setTimeout que llama a clearAuth cuando el token
   * esté a punto de expirar.
   */
  const scheduleAutoLogout = useCallback(
    (jwt) => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

      const delay = msUntilExpiry(jwt);
      if (delay <= 0) {
        // Ya expiró — limpiar inmediatamente
        clearAuth();
        return;
      }

      logoutTimerRef.current = setTimeout(() => {
        clearAuth();
      }, delay);
    },
    [clearAuth],
  );

  // Programar auto-logout cada vez que cambie el token
  useEffect(() => {
    if (token) {
      scheduleAutoLogout(token);
    }
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [token, scheduleAutoLogout]);

  // ── Acciones públicas ──────────────────────────────────────────────────────

  /**
   * Realiza el login contra el backend y almacena el token resultante.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   * @throws Si las credenciales son incorrectas o hay error de red
   */
  const login = useCallback(async (email, password) => {
    const { data } = await loginAdmin({ email, password });
    const jwt = data.access_token;

    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
  }, []);

  /**
   * Cierra la sesión del usuario de forma explícita.
   */
  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  // ── Valor del contexto ─────────────────────────────────────────────────────

  const value = {
    /** true si hay un token activo y no expirado */
    isAuthenticated: isTokenValid(token),

    /** El token JWT crudo (para pasárselo a adminApi si fuera necesario) */
    token,

    /** Payload decodificado: { sub, exp, ... } — solo para lectura */
    tokenPayload: token ? decodeJwtPayload(token) : null,

    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useAuth
 * Hook para consumir el contexto de autenticación desde cualquier componente.
 *
 * @returns {{ isAuthenticated: boolean, token: string|null, tokenPayload: object|null, login: Function, logout: Function }}
 * @throws Si se usa fuera de <AuthProvider>
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
