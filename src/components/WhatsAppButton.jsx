import { FaWhatsapp } from "react-icons/fa";
import "./WhatsAppButton.css";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/34632548698?text=Hola,%20quiero%20reservar%20una%20cita%20en%20Bulls%20Barber%20Shop"
      target="_blank"
      rel="noreferrer"
      className="whatsapp-btn"
      aria-label="Contactar por WhatsApp"
    >
      <FaWhatsapp />
      <span>¿Hablamos?</span>
    </a>
  );
}
