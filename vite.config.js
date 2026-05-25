import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // ── Configuración de Vitest ───────────────────────────────────────────────
  test: {
    // Permite usar describe/it/expect sin importarlos en cada fichero
    globals: true,
    // Simula el DOM del navegador con jsdom
    environment: "jsdom",
    // Fichero de setup que extiende jest-dom y arranca el servidor MSW
    setupFiles: ["./src/__tests__/setup.js"],
    // Alias de módulo para que MSW funcione en Node/jsdom
    server: {
      deps: {
        inline: ["msw"],
      },
    },
    // Incluye únicamente los ficheros de test de la carpeta __tests__
    include: ["src/__tests__/**/*.{test,spec}.{js,jsx}"],

    // Cobertura: solo el código con tests (meta ≥60 % en este alcance)
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/contexts/**",
        "src/hooks/**",
        "src/services/**",
        "src/pages/Booking.jsx",
        "src/pages/Services.jsx",
        "src/pages/NotFound.jsx",
        "src/pages/admin/AdminLogin.jsx",
        "src/pages/admin/AdminReservas.jsx",
        "src/components/admin/ProtectedRoute.jsx",
        "src/components/ServiceCard.jsx",
      ],
      exclude: ["src/**/*.css", "src/**/__tests__/**"],
      thresholds: {
        lines: 60,
        functions: 55,
        branches: 70,
        statements: 60,
        "src/services/**": { lines: 85, functions: 90, branches: 80, statements: 85 },
        "src/contexts/**": { lines: 90, functions: 100, branches: 75, statements: 90 },
      },
    },
  },

  server: {
    port: 5173,
    proxy: {
      // Redirige /api/* al backend en desarrollo.
      // - Sin Docker:   localhost:8000 (uvicorn local)
      // - Con Docker:   host.docker.internal:8000 (backend en el host)
      //   Para usar Docker dev, cambia la variable de entorno:
      //   VITE_BACKEND_HOST=host.docker.internal npm run dev
      "/api": {
        target: `http://${process.env.VITE_BACKEND_HOST || "localhost"}:8000`,
        changeOrigin: true,
      },
    },
  },
});
