/**
 * Fichero de setup global para Vitest.
 *
 * Se ejecuta ANTES de cada fichero de test gracias a vite.config.js → test.setupFiles.
 *
 * Estrategia HTTP (híbrida):
 *   - Tests de componentes y hooks: vi.mock de services/* (rápido, aislado).
 *   - Tests de api.js / adminApi.js: vi.mock de axios (contrato de rutas/params).
 *   - MSW (handlers.js): contrato HTTP de referencia alineado con el backend;
 *     no sustituye los mocks anteriores en la suite actual.
 *   - Futuro: ficheros *.integration.test.js pueden usar MSW sin mockear servicios.
 *
 * Responsabilidades de este fichero:
 *   1. Extender matchers con @testing-library/jest-dom
 *   2. Arrancar/detener el servidor MSW
 *   3. Limpiar localStorage entre tests
 */

import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

// ── MSW lifecycle ─────────────────────────────────────────────────────────────
// Arranca el servidor antes del primer test del fichero
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Resetea los handlers añadidos en tests individuales (server.use(...))
// para que no contaminen los siguientes tests
afterEach(() => {
  server.resetHandlers();
  // Limpiar localStorage para aislar el estado de autenticación
  localStorage.clear();
});

// Cierra el servidor al terminar todos los tests del fichero
afterAll(() => server.close());
