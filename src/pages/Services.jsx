import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApi } from "../hooks/useApi";
import { getServices } from "../services/api";
import SeoHead from "../components/SeoHead";
import ServiceCard from "../components/ServiceCard";
import "./Services.css";

const CATEGORIAS = ["todas", "corte", "barba", "combo", "tratamiento"];

// Datos de ejemplo mientras la API no tiene contenido
const PLACEHOLDER = [
  { id: 1, nombre: "Corte clásico", precio: 15, duracion_minutos: 30, categoria: "corte", descripcion: "Corte a tijera o máquina con acabado perfecto." },
  { id: 2, nombre: "Degradado", precio: 18, duracion_minutos: 35, categoria: "corte", descripcion: "Fade perfecto, desde skin hasta el largo que quieras." },
  { id: 3, nombre: "Corte infantil", precio: 12, duracion_minutos: 25, categoria: "corte", descripcion: "Paciencia y precisión para los más pequeños." },
  { id: 4, nombre: "Arreglo de barba", precio: 10, duracion_minutos: 20, categoria: "barba", descripcion: "Perfilado y arreglo de barba con navaja." },
  { id: 5, nombre: "Barba completa", precio: 15, duracion_minutos: 30, categoria: "barba", descripcion: "Recorte, perfilado y cuidado completo de barba." },
  { id: 6, nombre: "Corte + Barba", precio: 22, duracion_minutos: 50, categoria: "combo", descripcion: "El pack completo: corte y barba al mejor precio." },
];

export default function Services() {
  const [categoria, setCategoria] = useState("todas");
  const { data: services } = useApi(() => getServices(), []);

  const lista = services ?? PLACEHOLDER;
  const filtrados =
    categoria === "todas" ? lista : lista.filter((s) => s.categoria === categoria);

  return (
    <div className="page">
      <SeoHead
        title="Servicios"
        canonical="/servicios"
        description="Descubre todos los servicios de Bulls Barber Shop: corte de pelo, arreglo de barba, afeitado clásico y más. Precios claros y sin sorpresas."
      />
      {/* Header */}
      <section className="page-header">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="accent-line" />
            <h1 className="section-title">
              Nuestros <span>servicios</span>
            </h1>
            <p className="section-subtitle">
              Calidad y profesionalidad en cada corte.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filtros */}
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container">
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

          <div className="services-grid-page">
            {filtrados.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <ServiceCard service={s} />
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link to="/reservar" className="btn btn-gold">
              Reservar cita ahora
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
