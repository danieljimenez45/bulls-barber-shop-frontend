import { Link } from "react-router-dom";
import { FaInstagram, FaTiktok, FaMapMarkerAlt, FaPhone, FaClock } from "react-icons/fa";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        {/* Marca */}
        <div className="footer__brand">
          <div className="footer__logo">
            BULLS <span>BARBER</span>
          </div>
          <p className="footer__tagline">
            Donde cada corte cuenta una historia.
          </p>
          <div className="footer__socials">
            <a
              href="https://www.instagram.com/bulls.barber.shop98/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.tiktok.com/@bulls.barber.shop98"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
            >
              <FaTiktok />
            </a>
          </div>
        </div>

        {/* Navegación */}
        <div className="footer__col">
          <h4>Navegación</h4>
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/servicios">Servicios</Link></li>
            <li><Link to="/galeria">Galería</Link></li>
            <li><Link to="/resenas">Reseñas</Link></li>
            <li><Link to="/reservar">Reservar cita</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div className="footer__col">
          <h4>Encuéntranos</h4>
          <ul className="footer__info">
            <li>
              <FaMapMarkerAlt />
              <span>Ver en Google Maps</span>
            </li>
            <li>
              <FaPhone />
              <span>Llámanos o WhatsApp</span>
            </li>
            <li>
              <FaClock />
              <div>
                <p>Lun – Vie: 9:00 – 20:00</p>
                <p>Sáb: 9:00 – 18:00</p>
                <p>Dom: Cerrado</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} Bulls Barber Shop. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
