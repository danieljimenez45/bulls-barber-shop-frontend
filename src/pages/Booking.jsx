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

// Lun–Vie: 10:00–14:00 (mañana) + 16:00–20:30 (tarde, último slot a las 20:00)
const HORARIOS_MANANA_LV  = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"];
const HORARIOS_TARDE_LV   = ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];
// Sábado: 10:00–15:00 (último slot a las 14:30, servicio acaba a las 15:00)
const HORARIOS_MANANA_SAB = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];

/** Formatea un objeto Date como "YYYY-MM-DD" para la API */
const toApiDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Extrae "HH:MM" de un string ISO datetime devuelto por el backend */
const isoToHHMM = (isoString) => isoString.substring(11, 16);

/**
 * Construye un string datetime local sin zona horaria ("YYYY-MM-DDTHH:MM:00").
 * Evita que toISOString() convierta a UTC y desfase la hora en la BD.
 */
const toLocalIso = (date, hhmm) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${hhmm}:00`;
};

export default function Booking() {
  const { data: services } = useApi(() => getServices(), []);

  const [form, setForm] = useState({
    nombre_cliente: "",
    telefono: "",
    email: "",
    servicio_id: "",
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

    setEnviando(true);
    try {
      await createBooking({
        ...form,
        servicio_id: Number(form.servicio_id),
        fecha_hora: toLocalIso(fecha, hora),
      });
      toast.success("¡Reserva enviada! Te confirmaremos por teléfono.");
      setForm({
        nombre_cliente: "",
        telefono: "",
        email: "",
        servicio_id: "",
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

  // Horarios disponibles según el día de la semana
  const esSabado     = fecha?.getDay() === 6;
  const horariosManana = esSabado ? HORARIOS_MANANA_SAB : HORARIOS_MANANA_LV;
  const horariosTarde  = esSabado ? [] : HORARIOS_TARDE_LV;
  const todosSlots     = [...horariosManana, ...horariosTarde];
  const slotsLibres    = todosSlots.filter((h) => !slotsOcupados.has(h)).length;

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

            <h3 style={{ marginTop: "1.5rem" }}>Fecha y hora</h3>

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

            {/* Rejilla de slots — solo se muestra tras elegir fecha */}
            {fecha && (
              <div className="slots-section">
                <p className="slots-label">Hora *</p>

                {cargandoSlots ? (
                  <div className="slots-loading" aria-live="polite">
                    Consultando disponibilidad…
                  </div>
                ) : (
                  <>
                    {/* Mañana */}
                    <p className="slots-turno">Mañana</p>
                    <div className="slots-grid" role="group" aria-label="Horarios de mañana">
                      {horariosManana.map((h) => {
                        const ocupado = slotsOcupados.has(h);
                        const sel     = hora === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            className={`slot-btn${ocupado ? " slot-btn--ocupado" : ""}${sel ? " slot-btn--selected" : ""}`}
                            disabled={ocupado}
                            onClick={() => setHora(h)}
                            aria-pressed={sel}
                            aria-label={`${h}${ocupado ? ", ocupado" : ""}`}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tarde — solo Lun-Vie */}
                    {horariosTarde.length > 0 && (
                      <>
                        <p className="slots-turno">Tarde</p>
                        <div className="slots-grid" role="group" aria-label="Horarios de tarde">
                          {horariosTarde.map((h) => {
                            const ocupado = slotsOcupados.has(h);
                            const sel     = hora === h;
                            return (
                              <button
                                key={h}
                                type="button"
                                className={`slot-btn${ocupado ? " slot-btn--ocupado" : ""}${sel ? " slot-btn--selected" : ""}`}
                                disabled={ocupado}
                                onClick={() => setHora(h)}
                                aria-pressed={sel}
                                aria-label={`${h}${ocupado ? ", ocupado" : ""}`}
                              >
                                {h}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Resumen de disponibilidad */}
                    {slotsLibres === 0 ? (
                      <p className="slots-hint slots-hint--full" aria-live="polite">
                        Sin huecos disponibles este día
                      </p>
                    ) : slotsOcupados.size > 0 && (
                      <p className="slots-hint" aria-live="polite">
                        {slotsOcupados.size}{" "}
                        {slotsOcupados.size === 1 ? "horario ocupado" : "horarios ocupados"}
                        {" · "}{slotsLibres} disponibles
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

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
                <li><span>Lun – Vie</span><strong>10:00–14:00 / 16:00–20:30</strong></li>
                <li><span>Sábado</span><strong>10:00–15:00</strong></li>
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
