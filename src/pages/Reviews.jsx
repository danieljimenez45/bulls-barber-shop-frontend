import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useApi } from "../hooks/useApi";
import { getReviews, createReview } from "../api/reviews";
import SeoHead from "../components/SeoHead";
import ReviewCard from "../components/ReviewCard";
import "./Reviews.css";

export default function Reviews() {
  const { data: reviewsData, loading } = useApi(() => getReviews(), []);
  const reviews = reviewsData?.items ?? null;
  const [form, setForm] = useState({ nombre: "", valoracion: 5, comentario: "" });
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error("Escribe tu nombre");
    setEnviando(true);
    try {
      await createReview(form);
      toast.success("¡Gracias por tu reseña! La revisaremos pronto.");
      setForm({ nombre: "", valoracion: 5, comentario: "" });
    } catch {
      toast.error("Error al enviar la reseña. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="page">
      <SeoHead
        title="Reseñas"
        canonical="/resenas"
        description="Lee las opiniones de nuestros clientes en Bulls Barber Shop. Más de 5 estrellas en experiencia, trato y calidad de corte. Deja tu propia reseña."
      />
      <section className="page-header">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="accent-line" />
            <h1 className="section-title">
              Reseñas de <span>clientes</span>
            </h1>
            <p className="section-subtitle">
              La opinión honesta de quienes nos visitan.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container reviews-layout">
          {/* Lista de reseñas */}
          <div>
            {loading ? (
              <p style={{ color: "var(--text-secondary)" }}>Cargando reseñas…</p>
            ) : (
              <div className="reviews-list">
                {(reviews ?? []).map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
                {(!reviews || reviews.length === 0) && (
                  <p style={{ color: "var(--text-secondary)" }}>
                    Aún no hay reseñas. ¡Sé el primero en dejar la tuya!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Formulario nueva reseña */}
          <div className="review-form-wrap">
            <h3>Deja tu reseña</h3>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="review-nombre">Tu nombre</label>
                <input
                  id="review-nombre"
                  type="text"
                  placeholder="Nombre o alias"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  autoComplete="nickname"
                />
              </div>

              <div className="form-group">
                <label id="review-stars-label">Valoración</label>
                <div
                  className="star-selector"
                  role="group"
                  aria-labelledby="review-stars-label"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`star-btn ${n <= form.valoracion ? "star-btn--active" : ""}`}
                      onClick={() => setForm({ ...form, valoracion: n })}
                      aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                      aria-pressed={n === form.valoracion}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="review-comentario">Comentario (opcional)</label>
                <textarea
                  id="review-comentario"
                  placeholder="Cuéntanos tu experiencia…"
                  value={form.comentario}
                  onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-gold" disabled={enviando} style={{ width: "100%" }}>
                {enviando ? "Enviando…" : "Enviar reseña"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
