import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa";
import { useApi } from "../hooks/useApi";
import SeoHead from "../components/SeoHead";
import { getServices, getReviews } from "../services/api";
import ServiceCard from "../components/ServiceCard";
import ReviewCard from "../components/ReviewCard";
import "./Home.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const SERVICES_PLACEHOLDER = [
  { id: 1, nombre: "Corte clásico",  precio: 15, duracion_minutos: 30, categoria: "corte",  descripcion: "Tijera o máquina con acabado perfecto y detallado." },
  { id: 2, nombre: "Corte + Barba",  precio: 22, duracion_minutos: 50, categoria: "combo",  descripcion: "El pack completo: corte y arreglo de barba al mejor precio." },
  { id: 3, nombre: "Arreglo barba",  precio: 10, duracion_minutos: 20, categoria: "barba",  descripcion: "Perfilado, degradado y cuidado completo con navaja." },
];

const REVIEWS_PLACEHOLDER = [
  { id: 1, nombre: "Carlos M.",    valoracion: 5, comentario: "El mejor corte que he tenido. Jonathan es un crack, salí encantado.", created_at: new Date().toISOString() },
  { id: 2, nombre: "David R.",     valoracion: 5, comentario: "Llevo meses viniendo y siempre perfecto. Se adaptan totalmente a lo que pides.", created_at: new Date().toISOString() },
  { id: 3, nombre: "Alejandro P.", valoracion: 5, comentario: "Precio justo, buen rollo y resultado impecable. 100% recomendado.", created_at: new Date().toISOString() },
];

export default function Home() {
  const { data: services }     = useApi(() => getServices(), []);
  const { data: reviewsData }  = useApi(() => getReviews(),  []);

  const featuredServices = services?.slice(0, 3)                ?? SERVICES_PLACEHOLDER;
  const featuredReviews  = reviewsData?.items?.slice(0, 3)      ?? REVIEWS_PLACEHOLDER;

  return (
    <>
      <SeoHead
        canonical="/"
        description="Bulls Barber Shop — Barbería profesional en Madrid (Ciudad Lineal). Cortes modernos y clásicos, arreglo de barba y tratamientos. Reserva tu cita online sin esperas."
      />
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="container hero__content">

          {/* Izquierda — headline + CTA */}
          <motion.div className="hero__left" initial="hidden" animate="show" variants={fadeUp}>
            <span className="hero__tag">Barbería · Ciudad Lineal, Madrid</span>

            <h1 className="hero__title">
              BULLS<br />
              <span className="brand-word">BARBER</span><br />
              SHOP
            </h1>

            <p className="hero__desc">
              Para todo tipo de estilos — clásicos, modernos, fades y barba.
              Nos adaptamos a ti y buscamos lo que mejor te quede.
            </p>

            <div className="hero__actions">
              <Link to="/reservar" className="btn btn-gold">
                Reservar cita <FaArrowRight />
              </Link>
              <Link to="/servicios" className="btn btn-outline">
                Ver servicios
              </Link>
            </div>
          </motion.div>

          {/* Derecha — stats editoriales */}
          <motion.div className="hero__right" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
            {[
              { value: "312",  label: "Publicaciones en Instagram" },
              { value: "5 ★",  label: "Valoración media de clientes" },
              { value: "Solo", label: "Cita previa · 632 548 698" },
              { value: "100%", label: "Dedicación y detalle" },
            ].map((s) => (
              <div key={s.label} className="hero__stat">
                <div className="hero__stat-value">{s.value}</div>
                <div className="hero__stat-label">{s.label}</div>
              </div>
            ))}
          </motion.div>

        </div>

        <div className="hero__scroll">Scroll</div>
      </section>

      {/* ── FRANJA ────────────────────────────────────────────────────────── */}
      <div className="divider-strip">
        <div className="container divider-strip__inner">
          {["Cortes de precisión", "Degradados y fades", "Arreglo de barba", "C. Pepe Isbert 5 · Madrid", "632 548 698"].map((t) => (
            <div key={t} className="divider-strip__item">
              <span className="divider-strip__dot" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICIOS ─────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <span className="section-label">Lo que ofrecemos</span>
            <h2 className="section-title">Servicios</h2>
            <p className="section-subtitle">Calidad y detalle en cada trabajo.</p>
          </motion.div>

          <div className="services-grid">
            {featuredServices.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <Link to="/servicios" className="btn btn-outline">
              Ver todos los servicios <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container cta-section__inner">
          <div className="cta-section__text">
            <h2>¿Listo para tu próximo<br /><em>corte?</em></h2>
            <p>Reserva en segundos. Sin esperas, con cita previa.</p>
          </div>
          <div className="cta-section__actions">
            <Link to="/reservar" className="btn btn-gold">
              Reservar cita <FaArrowRight />
            </Link>
            <span className="cta-section__phone">Tel. 632 548 698</span>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── RESEÑAS ───────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <span className="section-label">Opiniones reales</span>
            <h2 className="section-title">Clientes</h2>
            <p className="section-subtitle">Lo que dicen quienes nos visitan.</p>
          </motion.div>

          <div className="reviews-grid">
            {featuredReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <Link to="/resenas" className="btn btn-outline">
              Ver todas las reseñas <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── INSTAGRAM ─────────────────────────────────────────────────────── */}
      <section className="ig-section">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <div className="ig-section__icon"><FaInstagram /></div>
            <span className="section-label" style={{ justifyContent: "center", display: "flex" }}>Instagram</span>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>@bulls.barber.shop98</h2>
            <p className="section-subtitle">312 publicaciones · sigue el trabajo de Jonathan.</p>
            <a
              href="https://www.instagram.com/bulls.barber.shop98/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Ver perfil <FaInstagram />
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
