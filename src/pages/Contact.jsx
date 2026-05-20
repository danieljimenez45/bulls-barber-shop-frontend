import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaMapMarkerAlt, FaPhone, FaClock, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { sendContact } from "../services/api";
import SeoHead from "../components/SeoHead";
import "./Contact.css";

export default function Contact() {
  const [form, setForm] = useState({
    nombre: "", email: "", telefono: "", asunto: "", mensaje: "",
  });
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.mensaje)
      return toast.error("Rellena los campos obligatorios");
    setEnviando(true);
    try {
      await sendContact(form);
      toast.success("¡Mensaje enviado! Te responderemos pronto.");
      setForm({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
    } catch {
      toast.error("Error al enviar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="page">
      <SeoHead
        title="Contacto"
        canonical="/contacto"
        description="Contacta con Bulls Barber Shop en Madrid. Estamos en C. de Pepe Isbert 5, Ciudad Lineal. Llámanos al 632 548 698 o escríbenos por Instagram o WhatsApp."
      />
      <section className="page-header">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="accent-line" />
            <h1 className="section-title"><span>Contacto</span></h1>
            <p className="section-subtitle">Estamos aquí para lo que necesites.</p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container contact-layout">

          {/* ── Info ── */}
          <div className="contact-info">

            <div className="contact-info__block">
              <FaMapMarkerAlt aria-hidden="true" />
              <div>
                <h4>Ubicación</h4>
                <p>C. de Pepe Isbert, 5<br />Cdad. Lineal, 28017 Madrid</p>
                <a
                  href="https://maps.app.goo.gl/8BysbHvzzH2kodWL7"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-info__link"
                >
                  Cómo llegar →
                </a>
              </div>
            </div>

            <div className="contact-info__block">
              <FaPhone aria-hidden="true" />
              <div>
                <h4>Teléfono / WhatsApp</h4>
                <a href="tel:+34632548698" className="contact-info__link">
                  632 548 698
                </a>
                <p style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>
                  Jonathan — Barbero principal
                </p>
              </div>
            </div>

            <div className="contact-info__block">
              <FaClock aria-hidden="true" />
              <div>
                <h4>Horario</h4>
                <p>Lun – Vie: 9:00 – 20:00</p>
                <p>Sábado: 9:00 – 18:00</p>
                <p>Domingo: Cerrado</p>
                <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Solo con cita previa
                </p>
              </div>
            </div>

            <div className="contact-info__socials">
              <h4>Síguenos</h4>
              <div className="contact-info__social-links">
                <a
                  href="https://www.instagram.com/bulls.barber.shop98/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaInstagram /> Instagram
                </a>
                <a
                  href="https://www.tiktok.com/@bulls.barber.shop98"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaTiktok /> TikTok
                </a>
                <a href="https://wa.me/34632548698" target="_blank" rel="noreferrer">
                  <FaWhatsapp /> WhatsApp
                </a>
              </div>
            </div>

            {/* Mapa — coordenadas reales: Alcorcón, Madrid */}
            <div className="contact-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3036.7!2d-3.6290!3d40.4360!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd422fa35f2d6819%3A0x5c4fca00da40383f!2sC.%20de%20Pepe%20Isbert%2C%205%2C%20Cdad.%20Lineal%2C%2028017%20Madrid!5e0!3m2!1ses!2ses!4v1"
                width="100%"
                height="250"
                style={{ border: 0, borderRadius: "var(--radius)" }}
                allowFullScreen
                loading="lazy"
                title="Ubicación Bulls Barber Shop — Alcorcón, Madrid"
              />
            </div>
          </div>

          {/* ── Formulario ── */}
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <h3>Envíanos un mensaje</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contact-nombre">Nombre *</label>
                <input
                  id="contact-nombre"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Email *</label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact-telefono">Teléfono (opcional)</label>
              <input
                id="contact-telefono"
                type="tel"
                placeholder="+34 600 000 000"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-asunto">Asunto</label>
              <input
                id="contact-asunto"
                type="text"
                placeholder="¿En qué podemos ayudarte?"
                value={form.asunto}
                onChange={(e) => setForm({ ...form, asunto: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-mensaje">Mensaje *</label>
              <textarea
                id="contact-mensaje"
                placeholder="Escribe tu mensaje aquí…"
                value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              disabled={enviando}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {enviando ? "Enviando…" : "Enviar mensaje"}
            </button>
          </form>

        </div>
      </section>
    </div>
  );
}
