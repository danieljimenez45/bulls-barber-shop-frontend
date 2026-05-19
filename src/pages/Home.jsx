import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaScissors, FaStar, FaArrowRight } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa";
import { useApi } from "../hooks/useApi";
import { getServices, getReviews } from "../services/api";
import ServiceCard from "../components/ServiceCard";
import ReviewCard from "../components/ReviewCard";
import "./Home.css";

// ── Animaciones ───────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Home() {
  const { data: services } = useApi(() => getServices(), []);
  const { data: reviews } = useApi(() => getReviews(), []);

  const featuredServices = services?.slice(0, 3) ?? [];
  const featuredReviews = reviews?.slice(0, 3) ?? [];

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__overlay" />
        <div className="container hero__content">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="hero__text"
          >
            <span className="hero__eyebrow">Barbería profesional</span>
            <h1>
              BULLS <span>BARBER</span>
              <br />
              SHOP
            </h1>
            <p>Cortes de precisión, estilo sin compromiso.</p>
            <div className="hero__actions">
              <Link to="/reservar" className="btn btn-gold">
                Reservar cita <FaArrowRight />
              </Link>
              <Link to="/servicios" className="btn btn-outline">
                Ver servicios
              </Link>
            </div>
          </motion.div>
        </div>
        {/* Scroll hint */}
        <div className="hero__scroll">
          <span />
        </div>
      </section>

      {/* ── NÚMEROS ────────────────────────────────────────────────────────── */}
      <section className="stats">
        <div className="container stats__grid">
          {[
            { value: "500+", label: "Clientes satisfechos" },
            { value: "5★", label: "Valoración media" },
            { value: "10+", label: "Años de experiencia" },
            { value: "100%", label: "Dedicación" },
          ].map((s) => (
            <div key={s.label} className="stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICIOS DESTACADOS ───────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="gold-line" />
            <h2 className="section-title">
              Nuestros <span>servicios</span>
            </h2>
            <p className="section-subtitle">
              Cada detalle, cuidado a la perfección.
            </p>
          </motion.div>

          {featuredServices.length > 0 ? (
            <div className="services-grid">
              {featuredServices.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          ) : (
            /* Placeholder cuando la API aún no tiene datos */
            <div className="services-grid">
              {[
                { id: 1, nombre: "Corte clásico", precio: 15, duracion_minutos: 30, categoria: "corte", descripcion: "Corte a tijera o máquina con acabado perfecto." },
                { id: 2, nombre: "Corte + Barba", precio: 22, duracion_minutos: 50, categoria: "combo", descripcion: "Corte completo y arreglo de barba incluido." },
                { id: 3, nombre: "Arreglo de barba", precio: 10, duracion_minutos: 20, categoria: "barba", descripcion: "Perfilado, degradado y cuidado de barba." },
              ].map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link to="/servicios" className="btn btn-outline">
              Ver todos los servicios <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="container cta-banner__inner">
          <div>
            <h2>¿Listo para tu próximo <span>corte?</span></h2>
            <p>Reserva tu cita en segundos, sin esperas.</p>
          </div>
          <Link to="/reservar" className="btn btn-gold">
            Reservar ahora <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* ── RESEÑAS ───────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="gold-line" />
            <h2 className="section-title">
              Lo que dicen <span>nuestros clientes</span>
            </h2>
            <p className="section-subtitle">
              Opiniones reales de personas reales.
            </p>
          </motion.div>

          {featuredReviews.length > 0 ? (
            <div className="reviews-grid">
              {featuredReviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          ) : (
            <div className="reviews-grid">
              {[
                { id: 1, nombre: "Carlos M.", valoracion: 5, comentario: "El mejor corte que he tenido. Ambiente increíble y muy profesionales.", created_at: new Date().toISOString() },
                { id: 2, nombre: "David R.", valoracion: 5, comentario: "Llevo meses viniendo y siempre salgo encantado. 100% recomendado.", created_at: new Date().toISOString() },
                { id: 3, nombre: "Alejandro P.", valoracion: 5, comentario: "Trato genial, precio justo y resultado perfecto. Sin duda los mejores.", created_at: new Date().toISOString() },
              ].map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link to="/resenas" className="btn btn-outline">
              Ver todas las reseñas <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM ────────────────────────────────────────────────────── */}
      <section className="section section--dark">
        <div className="container" style={{ textAlign: "center" }}>
          <FaInstagram style={{ fontSize: "2rem", color: "var(--gold)", marginBottom: "1rem" }} />
          <h2 className="section-title">
            Síguenos en <span>Instagram</span>
          </h2>
          <p className="section-subtitle">@bulls.barber.shop98</p>
          <a
            href="https://www.instagram.com/bulls.barber.shop98/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-gold"
          >
            Ver perfil <FaInstagram />
          </a>
        </div>
      </section>
    </>
  );
}
