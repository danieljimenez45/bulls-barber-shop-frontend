import { useState } from "react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import { createBooking } from "../services/api";
import { useApi } from "../hooks/useApi";
import { getServices } from "../services/api";
import "./Booking.css";

registerLocale("es", es);

const HORARIOS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];

const BARBEROS = ["Cualquier barbero", "Barbero 1", "Barbero 2"];

export default function Booking() {
  const { data: services } = useApi(() => getServices(), []);
  const [form, setForm] = useState({
    nombre_cliente: "",
    telefono: "",
    email: "",
    servicio_id: "",
    barbero: "Cualquier barbero",
    notas: "",
  });
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fecha || !hora) return toast.error("Selecciona fecha y hora");
    if (!form.nombre_cliente || !form.telefono) return toast.error("Rellena los campos obligatorios");
    if (!form.servicio_id) return toast.error("Selecciona un servicio");

    const [h, m] = hora.split(":").map(Number);
    const fechaHora = new Date(fecha);
    fechaHora.setHours(h, m, 0, 0);

    const servicio = services?.find((s) => s.id === Number(form.servicio_id));

    setEnviando(true);
    try {
      await createBooking({
        ...form,
        servicio_id: Number(form.servicio_id),
        servicio_nombre: servicio?.nombre ?? "",
        fecha_hora: fechaHora.toISOString(),
      });
      toast.success("¡Reserva enviada! Te confirmaremos por teléfono.");
      setForm({ nombre_cliente: "", telefono: "", email: "", servicio_id: "", barbero: "Cualquier barbero", notas: "" });
      setFecha(null);
      setHora("");
    } catch {
      toast.error("Error al crear la reserva. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  // No permitir domingos ni pasado
  const isDisabled = (date) => {
    const day = date.getDay();
    return day === 0; // domingo
  };

  return (
    <div className="page">
      <section className="page-header">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="accent-line" />
            <h1 className="section-title">
              Reserva tu <span>cita</span>
            </h1>
            <p className="section-subtitle">
              Elige fecha, hora y servicio. Sin esperas.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container booking-layout">
          <form className="booking-form" onSubmit={handleSubmit}>
            <h3>Tus datos</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={form.nombre_cliente}
                  onChange={(e) => setForm({ ...form, nombre_cliente: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono *</label>
                <input
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email (opcional)</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <h3 style={{ marginTop: "1.5rem" }}>Servicio</h3>

            <div className="form-group">
              <label>Servicio *</label>
              <select
                value={form.servicio_id}
                onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
                required
              >
                <option value="">Selecciona un servicio</option>
                {(services ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} — {s.precio} €
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Barbero</label>
              <select
                value={form.barbero}
                onChange={(e) => setForm({ ...form, barbero: e.target.value })}
              >
                {BARBEROS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <h3 style={{ marginTop: "1.5rem" }}>Fecha y hora</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha *</label>
                <DatePicker
                  selected={fecha}
                  onChange={setFecha}
                  filterDate={(d) => !isDisabled(d)}
                  minDate={new Date()}
                  locale="es"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecciona fecha"
                  className="datepicker-input"
                />
              </div>
              <div className="form-group">
                <label>Hora *</label>
                <select value={hora} onChange={(e) => setHora(e.target.value)} required>
                  <option value="">Selecciona hora</option>
                  {HORARIOS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notas (opcional)</label>
              <textarea
                placeholder="Cuéntanos algo sobre lo que quieres…"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-gold" disabled={enviando} style={{ width: "100%", justifyContent: "center" }}>
              {enviando ? "Enviando…" : "Confirmar reserva"}
            </button>
          </form>

          {/* Info lateral */}
          <div className="booking-info">
            <div className="booking-info__card card">
              <h4>Horario</h4>
              <ul>
                <li><span>Lun – Vie</span><strong>9:00 – 20:00</strong></li>
                <li><span>Sábado</span><strong>9:00 – 18:00</strong></li>
                <li><span>Domingo</span><strong>Cerrado</strong></li>
              </ul>
            </div>
            <div className="booking-info__card card">
              <h4>¿Tienes dudas?</h4>
              <p>Puedes contactarnos por WhatsApp o Instagram y te atendemos enseguida.</p>
              <a
                href="https://www.instagram.com/bulls.barber.shop98/"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ marginTop: "1rem", justifyContent: "center" }}
              >
                Escribir por Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
