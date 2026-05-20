import { Helmet } from "react-helmet-async";

const SITE_NAME = "Bulls Barber Shop";
const BASE_URL = "https://bullsbarbershop.es";
const DEFAULT_DESCRIPTION =
  "Bulls Barber Shop — Barbería profesional en Madrid. Cortes, arreglo de barba y tratamientos. Reserva tu cita online de forma rápida y sencilla.";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

/**
 * Componente SEO reutilizable.
 * @param {string}  title       — Título de la página (sin el sufijo del site)
 * @param {string}  description — Descripción de la página
 * @param {string}  canonical   — Path canónico, ej. "/servicios"
 * @param {string}  ogImage     — URL absoluta de la imagen Open Graph
 */
export default function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical = "",
  ogImage = DEFAULT_IMAGE,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = `${BASE_URL}${canonical}`;

  return (
    <Helmet>
      {/* Básicos */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
