import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import { createBooking, getDisponibilidad } from "../api/bookings";
import { getServices } from "../api/services";
import { useApi } from "../hooks/useApi";
import SeoHead from "../components/SeoHead";
import "./Booking.css";

registerLocale("es", es);

const HORARIOS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30",
];

const BARBEROS = ["Cualquier barbero", "Barbero 1", "Barbero 2"];

/** Formatea un objeto Date como "YYYY-MM-DD" para la API */
const toApiDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Extrae "HH:MM" de un string ISO datetime devuelto por el backend */
const isoToHHMM = (isoString) => isoString.substring(11, 16);

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

  // Disponibilidad
  const [slotsOcupados, setSlotsOcupados] = useState(new Set());
  const [cargandoSlots, setCargandoSlots] = useState(false);

  // Consultar disponibilidad cada vez que cambia la fecha
  useEffect(() => {
    if (!fecha) {
      setSlotsOcupados(new Set());
      return;
    }

    let cancelado = false;

    const fetchDisponibilidad = async () => {
      setCargandoSlots(true);
      try {
        const res = await getDisponibilidad(toApiDate(fecha));
        if (cancelado) return;
        const ocupados = new Set(res.data.slots_ocupados.map(isoToHHMM));
        setSlotsOcupados(ocupados);
        // Si la hora ya elegida queda ocupada, limpiarla y avisar
        if (hora && ocupados.has(hora)) {
          setHora("");
          toast("Ese horario acaba de ocuparse, elige otro.", { icon: "⚠️" });
        }
      } catch {
        if (!cancelado) setSlotsOcupados(new Set());
      } finally {
        if (!cancelado) setCargandoSlots(false);
      }
    };

    fetchDisponibilidad();
    return () => { cancelado = true; };
  }, [fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fecha || !hora) return toast.error("Selecciona fecha y hora");
    if (!form.nombre_cliente || !form.telefono)
      return toast.error("Rellena los campos obligatorios");
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
      setForm({
        nombre_cliente: "",
        telefono: "",
        email: "",
        servicio_id: "",
        barbero: "Cualquier barbero",
        notas: "",
      });
      setFecha(null);
      setHora("");
      setSlotsOcupados(new Set());
    } catch (err) {
      if (err.response?.status === 409) {
        // El slot se ocupó justo antes de enviar — refrescar disponibilidad
        toast.error(
          err.response.data?.detail ||
            "Ese horario acaba de reservarse. Por favor elige otro.",
          { duration: 6000 }
        );
        setHora("");
        try {
          const res = await getDisponibilidad(toApiDate(fecha));
          setSlotsOcupados(new Set(res.data.slots_ocupados.map(isoToHHMM)));
        } catch { /* silenciar */ }
      } else {
        toast.error("Error al crear la reserva. Inténtalo de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  };

  const isDisabled = (date) => date.getDay() === 0; // cerrado domingos

  const slotsLibres = HORARIOS.filter((h) => !slotsOcupados.has(h)).length;

  return (
    <div className="page">
      <SeoHead
        title="Reserva tu cita"
        canonical="/reservar"
        description="Reserva tu cita en Bulls Barber Shop de forma rápida y sencilla. Elige fecha, hora y servicio. Sin esperas, confirmación inmediata."
      />
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
          <form className="booking-form" onSubmit={handleSubmit} noValidate>
            <h3>Tus datos</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="booking-nombre">Nombre *</label>
                <input
                  id="booking-nombre"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={form.nombre_cliente}
                  onChange={(e) => setForm({ ...form, nombre_cliente: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="booking-telefono">Teléfono *</label>
                <input
                  id="booking-telefono"
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="booking-email">Email (opcional — recibirás confirmación)</label>
              <input
                id="booking-email"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <h3 style={{ marginTop: "1.5rem" }}>Servicio</h3>

            <div className="form-group">
              <label htmlFor="booking-servicio">Servicio *</label>
              <select
                id="booking-servicio"
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
              <label htmlFor="booking-barbero">Barbero</label>
              <select
                id="booking-barbero"
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
                <label htmlFor="booking-fecha">Fecha *</label>
                <DatePicker
                  id="booking-fecha"
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
                <label htmlFor="booking-hora">Hora *</label>
                <select
                  id="booking-hora"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                  disabled={!fecha || cargandoSlots}
                  aria-busy={cargandoSlots}
                >
                  <option value="">
                    {cargandoSlots
                      ? "Consultando disponibilidad…"
                      : fecha
                      ? "Selecciona hora"
                      : "Primero elige fecha"}
                  </option>
                  {HORARIOS.map((h) => {
                    const ocupado = slotsOcupados.has(h);
                    return (
                      <option key={h} value={h} disabled={ocupado}>
                        {h}{ocupado ? " — ocupado" : ""}
                      </option>
                    );
                  })}
                </select>
                {fecha && !cargandoSlots && slotsOcupados.size > 0 && (
                  <p className="slots-hint" aria-live="polite">
                    {slotsLibres === 0
                      ? "Sin huecos disponibles este día"
                      : `${slotsOcupados.size} ${
                          slotsOcupados.size === 1 ? "horario ocupado" : "horarios ocupados"
                        } · ${slotsLibres} disponibles`}
                  </p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="booking-notas">Notas (opcional)</label>
              <textarea
                id="booking-notas"
                placeholder="Cuéntanos algo sobre lo que quieres…"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={enviando || cargandoSlots}
              style={{ width: "100%", justifyContent: "center" }}
            >
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
