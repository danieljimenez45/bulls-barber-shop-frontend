import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useApi } from "../hooks/useApi";
import { getReviews, createReview } from "../services/api";
import ReviewCard from "../components/ReviewCard";
import "./Reviews.css";

export default function Reviews() {
  const { data: reviews, loading } = useApi(() => getReviews(), []);
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
      <section className="page-header">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="gold-line" />
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
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tu nombre</label>
                <input
                  type="text"
                  placeholder="Nombre o alias"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Valoración</label>
                <div className="star-selector">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`star-btn ${n <= form.valoracion ? "star-btn--active" : ""}`}
                      onClick={() => setForm({ ...form, valoracion: n })}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Comentario (opcional)</label>
                <textarea
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
