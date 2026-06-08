/**
 * gallery.js — funciones de la API de galería.
 *
 * Funciones públicas (sin autenticación):
 *   getGallery
 *
 * Funciones de administración (requieren JWT):
 *   listGallery, deleteGalleryImage, uploadGalleryImage
 */

import { createClient, getApiBase, TOKEN_KEY } from "./http/client";

const api      = createClient();
const adminApi = createClient({ withAuth: true });

// ── Público ───────────────────────────────────────────────────────────────────

/** Devuelve PagedResponse<GalleryImageOut>, con filtro opcional de categoría. */
export const getGallery = (categoria) =>
  api.get("/gallery/", { params: { categoria } });

// ── Admin ─────────────────────────────────────────────────────────────────────

/** Lista imágenes de la galería (todas, sin filtro de visibilidad). */
export const listGallery = ({ categoria, page = 1, size = 100 } = {}) =>
  adminApi.get("/gallery/", {
    params: { ...(categoria && { categoria }), page, size },
  });

/** Elimina una imagen de la galería por ID. */
export const deleteGalleryImage = (id) => adminApi.delete(`/gallery/${id}`);

/**
 * Sube una imagen a la galería con seguimiento de progreso.
 * Usa XMLHttpRequest en lugar de fetch/axios para acceder al evento upload.onprogress.
 *
 * @param {FormData} formData  - debe incluir: file (File), titulo (string|null), categoria (string)
 * @param {(pct: number) => void} [onProgress] - callback con porcentaje 0-100
 * @returns {Promise<GalleryImageOut>}
 */
export const uploadGalleryImage = (formData, onProgress) =>
  new Promise((resolve, reject) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const xhr   = new XMLHttpRequest();

    xhr.open("POST", `${getApiBase()}/gallery/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let detail = `Error ${xhr.status}`;
        try { detail = JSON.parse(xhr.responseText)?.detail ?? detail; } catch { /* noop */ }
        reject(new Error(detail));
      }
    };

    xhr.onerror = () => reject(new Error("Error de red al subir la imagen"));
    xhr.send(formData);
  });
