import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "./Navbar.css";

const LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/servicios", label: "Servicios" },
  { to: "/galeria", label: "Galería" },
  { to: "/resenas", label: "Reseñas" },
  { to: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Cerrar menú al navegar
  useEffect(() => {
    setOpen(false);
  }, [location]);

  // Fondo al hacer scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          BULLS <span>BARBER</span>
        </Link>

        {/* Links desktop */}
        <ul className="navbar__links">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  isActive ? "navbar__link navbar__link--active" : "navbar__link"
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link to="/reservar" className="btn btn-gold navbar__cta">
          Reservar cita
        </Link>

        {/* Hamburger */}
        <button
          className="navbar__burger"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Menú móvil */}
      {open && (
        <div className="navbar__mobile">
          <ul>
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    isActive ? "navbar__link navbar__link--active" : "navbar__link"
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link to="/reservar" className="btn btn-gold">
                Reservar cita
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
