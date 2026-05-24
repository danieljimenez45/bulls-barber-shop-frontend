import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
