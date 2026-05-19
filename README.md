# Bulls Barber Shop — Frontend

Interfaz web construida con **React 18 + Vite**. Tema oscuro y moderno.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
cd frontend
npm install
cp .env.example .env
```

## Desarrollo

```bash
npm run dev
```

La app estará en `http://localhost:5173`
El proxy de Vite redirige `/api/*` → `http://localhost:8000` (backend)

## Build para producción

```bash
npm run build
```

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Home — Hero, servicios destacados, reseñas, Instagram |
| `/servicios` | Lista completa con filtro por categoría |
| `/galeria` | Grid de fotos con lightbox |
| `/resenas` | Reseñas de clientes + formulario |
| `/reservar` | Formulario de reserva de cita |
| `/contacto` | Formulario + info + mapa |

## Estructura

```
frontend/
├── src/
│   ├── components/     # Navbar, Footer, ServiceCard, ReviewCard
│   ├── pages/          # Home, Services, Gallery, Reviews, Booking, Contact
│   ├── hooks/          # useApi
│   ├── services/       # api.js (axios)
│   └── styles/         # global.css, variables.css (CSS custom properties)
├── index.html
├── vite.config.js
└── package.json
```
