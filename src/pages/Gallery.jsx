import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useApi } from "../hooks/useApi";
import { getGallery } from "../services/api";
import SeoHead from "../components/SeoHead";
import "./Gallery.css";

const CATEGORIAS = ["todas", "corte", "barba", "local"];

// Placeholders hasta tener imágenes reales
const PLACEHOLDER = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  imagen_url: `https://placehold.co/600x600/1a1a1a/ffffff?text=Bulls+${i + 1}`,
  titulo: `Trabajo ${i + 1}`,
  categoria: ["corte", "barba", "local"][i % 3],
}));

export default function Gallery() {
  const [categoria, setCategoria] = useState("todas");
  const [selected, setSelected] = useState(null);
  const { data: galleryData } = useApi(() => getGallery(), []);

  const lista = galleryData?.items ?? PLACEHOLDER;
  const filtradas =
    categoria === "todas" ? lista : lista.filter((img) => img.categoria === categoria);

  return (
    <div className="page">
      <SeoHead
        title="Galería"
        canonical="/galeria"
        description="Echa un vistazo a nuestros trabajos en Bulls Barber Shop. Fotos reales de cortes, degradados y arreglos de barba realizados por nuestros barberos."
      />
      <section className="page-header">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="accent-line" />
            <h1 className="section-title">
              Nuestra <span>galería</span>
            </h1>
            <p className="section-subtitle">
              Cada foto habla por sí sola.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container">
          {/* Filtros */}
          <div className="filter-tabs">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                className={`filter-tab ${categoria === cat ? "filter-tab--active" : ""}`}
                onClick={() => setCategoria(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="gallery-grid">
            <AnimatePresence>
              {filtradas.map((img) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="gallery-item"
                  onClick={() => setSelected(img)}
                >
                  <img src={img.imagen_url} alt={img.titulo ?? "Foto galería"} />
                  <div className="gallery-item__overlay">
                    <span>{img.titulo ?? img.categoria}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <button className="lightbox__close" onClick={() => setSelected(null)}>
            <FaTimes />
          </button>
          <img
            src={selected.imagen_url}
            alt={selected.titulo}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
