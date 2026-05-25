/**
 * Servidor MSW para el entorno Node/jsdom de Vitest.
 *
 * Se usa setupServer (no setupWorker) porque los tests corren en Node,
 * no en un Service Worker de navegador real.
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Exportamos el servidor para poder añadir handlers en tests concretos
export const server = setupServer(...handlers);
