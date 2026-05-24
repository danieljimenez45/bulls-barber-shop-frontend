# Docker — Bulls Barber Shop Frontend

Guía para levantar el frontend en contenedor Docker, tanto en desarrollo como en producción.

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- El **backend** corriendo en el puerto 8000 (en el host o en su propio contenedor)

---

## Estructura de ficheros

```
frontend/
├── docker/
│   ├── Dockerfile                 # stages: deps → dev / builder → prod
│   ├── docker-compose.dev.yml     # entorno de desarrollo (Vite HMR)
│   ├── docker-compose.prod.yml    # entorno de producción (bundle compilado)
│   └── DOCKER.md                  # esta guía
└── .dockerignore
```

---

## Desarrollo

El contenedor monta el código fuente como volumen y arranca el **servidor de desarrollo de Vite** con hot module replacement (HMR). Los cambios en los ficheros `.jsx`, `.css`, etc. se reflejan en el navegador al instante sin reconstruir la imagen.

El proxy de Vite redirige automáticamente las llamadas `/api/*` al backend en el host, por lo que **no necesitas configurar ninguna URL**.

### Levantar

```bash
# Desde la raíz del repo frontend/
docker compose -f docker/docker-compose.dev.yml up --build
```

La app queda disponible en **http://localhost:5173**

> El backend debe estar corriendo en **http://localhost:8000** (o en Docker — ver nota más abajo).

### Parar

```bash
docker compose -f docker/docker-compose.dev.yml down
```

### Ver logs

```bash
docker compose -f docker/docker-compose.dev.yml logs -f
```

### Nota — backend también en Docker

Si el backend corre en su propio contenedor Docker (no directamente en el host), el proxy de Vite ya está configurado para usar `host.docker.internal` automáticamente. No necesitas cambiar nada.

---

## Producción

Vite compila el proyecto generando un bundle optimizado de ficheros estáticos. Esos ficheros se sirven con `serve`, un servidor HTTP ligero. **No hay hot reload ni servidor de desarrollo.**

La URL del backend se incrusta en el bundle durante el build mediante la variable `VITE_API_URL`. Si cambias esa URL después del build, debes **reconstruir la imagen**.

### Levantar

```bash
# Desde la raíz del repo frontend/
# Sustituye la URL por la del servidor donde corre el backend
VITE_API_URL=http://tuservidor:8000 \
docker compose -f docker/docker-compose.prod.yml up --build -d
```

La app queda disponible en **http://localhost:3000**

### Parar

```bash
docker compose -f docker/docker-compose.prod.yml down
```

### Ver logs

```bash
docker compose -f docker/docker-compose.prod.yml logs -f
```

### Levantar sin reconstruir (arranques posteriores)

```bash
docker compose -f docker/docker-compose.prod.yml up -d
```

### Reconstruir la imagen (tras actualizar código o cambiar VITE_API_URL)

```bash
VITE_API_URL=http://tuservidor:8000 \
docker compose -f docker/docker-compose.prod.yml up --build -d
```

---

## VITE_API_URL — cuándo y cómo usarla

`VITE_API_URL` le dice al frontend dónde está el backend. Solo se necesita en **producción**.

| Escenario                              | Valor                            |
|----------------------------------------|----------------------------------|
| Backend y frontend en el mismo host    | `http://localhost:8000`          |
| Backend en otro servidor               | `http://192.168.1.100:8000`      |
| Backend con dominio propio             | `https://api.bullsbarbershop.es` |
| Con nginx como proxy (futuro)          | No se necesita — nginx lo maneja |

Puedes definirla en un fichero `.env` en la raíz del repo en lugar de pasarla cada vez:

```bash
# frontend/.env
VITE_API_URL=http://tuservidor:8000
```

```bash
# Luego simplemente:
docker compose -f docker/docker-compose.prod.yml up --build -d
```

> **Importante:** `.env` está en `.gitignore`. No lo subas al repositorio.

---

## Puertos

| Entorno     | Puerto host | Puerto contenedor | Servidor       |
|-------------|-------------|-------------------|----------------|
| Desarrollo  | 5173        | 5173              | Vite dev server|
| Producción  | 3000        | 3000              | serve          |

Para cambiar el puerto del host edita el compose correspondiente:
```yaml
ports:
  - "8080:3000"   # la app responde en localhost:8080
```

---

## Diferencias entre dev y prod

| Característica        | Dev                        | Prod                          |
|-----------------------|----------------------------|-------------------------------|
| Servidor              | Vite dev server            | `serve` (estáticos compilados)|
| Hot reload            | ✅ HMR instantáneo         | ❌                            |
| Código en imagen      | ❌ (montado como volumen)  | ✅ (copiado en el build)      |
| VITE_API_URL          | No se usa (proxy de Vite)  | Obligatoria                   |
| Puerto                | 5173                       | 3000                          |
| Velocidad de inicio   | Rápida (sin compilar)      | Más lenta (compila el bundle) |
| Tamaño de imagen      | Mayor (node_modules)       | Menor (solo dist/)            |
