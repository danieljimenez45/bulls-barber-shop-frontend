import { FaClock } from "react-icons/fa";
import "./ServiceCard.css";

export default function ServiceCard({ service }) {
  return (
    <div className="service-card">
      {service.imagen_url && (
        <div className="service-card__img">
          <img src={service.imagen_url} alt={service.nombre} />
        </div>
      )}
      <div className="service-card__body">
        {/* Tag de categoría — único lugar donde el rojo aparece en las cards */}
        <span className="service-card__tag">{service.categoria}</span>
        <h3>{service.nombre}</h3>
        {service.descripcion && <p>{service.descripcion}</p>}
        <div className="service-card__footer">
          <span className="service-card__price">{service.precio} €</span>
          <span className="service-card__duration">
            <FaClock /> {service.duracion_minutos} min
          </span>
        </div>
      </div>
    </div>
  );
}
