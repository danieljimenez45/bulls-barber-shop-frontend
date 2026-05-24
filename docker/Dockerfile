# ──────────────────────────────────────────────────────────────────────────────
# frontend/docker/Dockerfile — Bulls Barber Shop Frontend
#
# Stages:
#   deps    → instala node_modules (caché compartida)
#   dev     → Vite dev server con hot reload (código montado como volumen)
#   builder → compila el bundle de producción con VITE_API_URL incrustada
#   prod    → sirve el bundle compilado con `serve`
#
# Contexto de build: frontend/   (un nivel arriba de docker/)
# ──────────────────────────────────────────────────────────────────────────────


# ══════════════════════════════════════════════════════════════════════════════
# DEPS — instala dependencias (capa de caché compartida por dev y prod)
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --silent


# ══════════════════════════════════════════════════════════════════════════════
# DEV — Vite dev server con hot reload
# El código llega por volumen; el proxy de Vite maneja /api → backend
# ══════════════════════════════════════════════════════════════════════════════
FROM deps AS dev

EXPOSE 5173

# --host: necesario para que Vite escuche en todas las interfaces del contenedor
CMD ["npm", "run", "dev", "--", "--host"]


# ══════════════════════════════════════════════════════════════════════════════
# BUILDER — compila el bundle de producción
# ══════════════════════════════════════════════════════════════════════════════
FROM deps AS builder

# VITE_API_URL se incrusta en el bundle durante el build.
# Si cambias la URL del backend debes reconstruir la imagen.
# Con nginx (futuro) esta variable desaparece y el proxy maneja /api.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build
# Resultado: /app/dist/


# ══════════════════════════════════════════════════════════════════════════════
# PROD — sirve el bundle compilado con `serve`
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS prod

RUN npm install -g serve --silent

WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# -s (single-page): redirige rutas desconocidas a index.html → React Router
CMD ["serve", "-s", "dist", "-l", "3000"]
