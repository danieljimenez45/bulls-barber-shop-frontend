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
            BULLS <span>BARBER</span> SHOP
          </div>
          <p className="footer__tagline">
            Barbería para todo tipo de estilos — clásicos, modernos.
            Nos acoplamos a lo que mejor te quede.
          </p>
          <div className="footer__socials">
            <a href="https://www.instagram.com/bulls.barber.shop98/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://www.tiktok.com/@bulls.barber.shop98" target="_blank" rel="noreferrer" aria-label="TikTok">
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
          <h4>Dónde estamos</h4>
          <ul className="footer__info">
            <li>
              <FaMapMarkerAlt />
              <a href="https://maps.app.goo.gl/8BysbHvzzH2kodWL7" target="_blank" rel="noreferrer">
                C. de Pepe Isbert, 5<br />
                Cdad. Lineal, 28017 Madrid
              </a>
            </li>
            <li>
              <FaPhone />
              <a href="tel:+34632548698">632 548 698</a>
            </li>
            <li>
              <FaClock />
              <div>
                <p>Lun – Vie: 9:00 – 20:00</p>
                <p>Sábado: 9:00 – 18:00</p>
                <p>Domingo: Cerrado</p>
              </div>
            </li>
          </ul>
        </div>

      </div>

      <div className="footer__bottom container">
        <p>© {new Date().getFullYear()} Bulls Barber Shop · C. de Pepe Isbert 5, Ciudad Lineal, Madrid</p>
        <p>Solo cita previa · 632 548 698</p>
      </div>
    </footer>
  );
}
