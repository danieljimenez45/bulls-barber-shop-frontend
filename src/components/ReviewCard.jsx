import { FaStar, FaRegStar } from "react-icons/fa";
import "./ReviewCard.css";

function Stars({ rating }) {
  return (
    <div className="stars">
      {Array.from({ length: 5 }, (_, i) =>
        i < rating ? <FaStar key={i} /> : <FaRegStar key={i} />
      )}
    </div>
  );
}

export default function ReviewCard({ review }) {
  const fecha = new Date(review.created_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="review-card card">
      <div className="review-card__header">
        <div className="review-card__avatar">
          {review.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="review-card__name">{review.nombre}</p>
          <p className="review-card__date">{fecha}</p>
        </div>
      </div>
      <Stars rating={review.valoracion} />
      {review.comentario && (
        <p className="review-card__comment">"{review.comentario}"</p>
      )}
    </div>
  );
}
