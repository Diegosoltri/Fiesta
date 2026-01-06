// Invitación Web de Cumple — React + Tailwind (responsive) 
// --------------------------------------------------------
// ✔ Móvil primero, responsive.
// ✔ Link único para compartir.
// ✔ Formulario de RSVP (POST a endpoint configurable: Formspree/Netlify/tu API).
// ✔ Persistencia local (localStorage) para evitar RSVP duplicados en el mismo dispositivo.
// ✔ Botones: Agregar a calendario (Google/ICS), Ver mapa, Compartir por WhatsApp.
// ✔ Metadatos Open Graph para vista previa al compartir.
// 
// Cómo usar
// 1) Copia este archivo en un proyecto React (Vite/Next) o usa la previsualización del canvas.
// 2) Cambia los valores en "CONFIG".
// 3) Para guardar RSVP:
//    • Opción rápida: crea un endpoint en https://formspree.io/ y pega la URL en CONFIG.RSVP_ENDPOINT.
//    • Alternativa: Netlify Forms o tu propia API (el body se envía como JSON).
// 4) Despliega en Vercel/Netlify/GitHub Pages y comparte el enlace.
// --------------------------------------------------------

import { useMemo, useRef, useState, useEffect } from "react";
import fondo from './assets/foto4.jpeg';
import fondo1 from './assets/foto3.jpeg';
import fondo2 from './assets/foto2.jpeg';
import emailjs from '@emailjs/browser';
// === ENV (Vite) ===
const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;
if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  // Ayuda de depuración: variables no definidas
  console.warn("[RSVP] Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON. Revisa tu .env y reinicia el dev server.");
}
// ====== CONFIGURACIÓN BÁSICA ======
const CONFIG = {
  title: "¡Fiesta de Texzar!",
  hostName: "Texzar",
  // Fecha/hora en TU zona local; ajusta también TZ_STRING si quieres precisión al generar ICS/Google Calendar
  dateISO: "2025-09-20T15:00:00", // 20 sept 2025 15:00
  durationMinutes: 240, // 4 horas
  TZ_STRING: "America/Mexico_City",
  locationLabel: "Salón Party House",
  locationAddress: "Calzada al sumidero y avenida vecinal #1440, Tuxtla Gutiérrez, Chiapas",
  mapsQuery: "Calzada al sumidero y avenida vecinal #1440, Tuxtla Gutiérrez, Chiapas",
  coverImage: fondo,
  photos: [fondo,fondo1,fondo2], // agrega más: import otras imágenes de ./assets y ponlas aquí
  // Texto de invitación
  inviteText:
    "Estás invitad@ a celebrar conmigo. Mis 50 años. ¡Ven con mucha actitud!",
  dressCode: "Guapos para la foto",
  hashtag: "Por Diego",
  // RSVP
  RSVP_ENDPOINT: "", // p.ej. "https://formspree.io/f/xxxxxx" — si vacío, hará solo demo + localStorage
  allowCompanions: true,
  contactPhone: "+529611884434", // para WhatsApp
  // Enlace público que compartirás (para botón de WhatsApp); cambia cuando despliegues
  publicShareURL: "https://tusitio.com/cumple-diego",
};

// ====== UTILIDADES FECHA/CALENDARIOS ======
function toDateParts(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    yyyy: d.getFullYear(),
    mm: pad(d.getMonth() + 1),
    dd: pad(d.getDate()),
    hh: pad(d.getHours()),
    min: pad(d.getMinutes()),
  };
}

function addMinutes(dateISO, minutes) {
  const d = new Date(dateISO);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function icsDateUTC(iso) {
  // conv a formato ICS en UTC: YYYYMMDDTHHMMSSZ
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function buildICS({ title, description, location, startISO, endISO }) {
  const uid = `${Date.now()}@invite`; // simple UID
  const dtstamp = icsDateUTC(new Date().toISOString());
  const dtstart = icsDateUTC(startISO);
  const dtend = icsDateUTC(endISO);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:-//Cumple Invite//ES",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return body;
}

function escapeICS(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,|;/g, (m) => (m === "," ? "\\," : "\\;"));
}

function downloadFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function googleCalendarURL({ title, details, location, startISO, endISO }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    location,
    dates: `${icsDateUTC(startISO)}/${icsDateUTC(endISO)}`,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

// ====== INTRO (splash) ======
function Intro({ stage, onSkip }) {
  return (
    <div className="min-h-screen w-full bg-red-700 text-white flex items-center justify-center relative">
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 text-xs rounded-full bg-white/10 hover:bg-white/20 px-3 py-1"
      >
        Saltar
      </button>

      {stage === "introMessage" && (
        <div className="text-center animate-fade bg-red-600 text-white p-6 rounded-lg">
          <p className="text-sm tracking-widest uppercase opacity-80">Bienvenid@</p>
          <h1 className="mt-2 text-3xl font-bold">Listo Para la carrera</h1>
        </div>
      )}

      {stage === "introIcon" && (
        <div className="text-center animate-pop">
          {/* Icono de coche (SVG inline) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            className="w-24 h-24 mx-auto"
            fill="currentColor"
          >
            <path d="M380-733.33h66.67V-800H380v66.67Zm133.33 0V-800H580v66.67h-66.67ZM380-466.67v-66.66h66.67v66.66H380ZM646.67-600v-66.67h66.66V-600h-66.66Zm0 133.33v-66.66h66.66v66.66h-66.66Zm-133.34 0v-66.66H580v66.66h-66.67Zm133.34-266.66V-800h66.66v66.67h-66.66Zm-200 66.66v-66.66h66.66v66.66h-66.66ZM246.67-160v-640h66.66v66.67H380v66.66h-66.67V-600H380v66.67h-66.67V-160h-66.66ZM580-533.33V-600h66.67v66.67H580Zm-133.33 0V-600h66.66v66.67h-66.66ZM380-600v-66.67h66.67V-600H380Zm133.33 0v-66.67H580V-600h-66.67ZM580-666.67v-66.66h66.67v66.66H580Z"/>
          </svg>
          <p className="mt-3 text-lg">Arrancando…</p>
        </div>
      )}
    </div>
  );
}

// ====== COMPONENTE PRINCIPAL ======
export default function BirthdayInvite() {
  const startISO = CONFIG.dateISO;
  const endISO = addMinutes(CONFIG.dateISO, CONFIG.durationMinutes);

  const [form, setForm] = useState({
    name: "",
    contactMethod: "email", // nuevo: 'email' | 'phone'
    email: "",
    phone: "",
    attending: "sí",
    guests: CONFIG.allowCompanions ? 0 : 0,
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | ok | error
  const [sentTicket, setSentTicket] = useState(null);
  const formRef = useRef(null);

  // Intro splash control
  const [stage, setStage] = useState("introMessage"); // introMessage -> introIcon -> invite
  useEffect(() => {
    const t1 = setTimeout(() => setStage("introIcon"), 2300);
    const t2 = setTimeout(() => setStage("invite"), 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Idempotencia por dispositivo
  const STORAGE_KEY = useMemo(() => `rsvp-${btoa(CONFIG.title).slice(0, 8)}`, []);

  // Lee si ya se envió antes
  const already = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, [STORAGE_KEY]);

  const eventParts = toDateParts(startISO);
  const shareText = encodeURIComponent(
    `${CONFIG.title} — ${CONFIG.inviteText}\n\nCuándo: ${eventParts.dd}/${eventParts.mm}/${eventParts.yyyy} a las ${eventParts.hh}:${eventParts.min} (${CONFIG.TZ_STRING})\nDónde: ${CONFIG.locationLabel} — ${CONFIG.locationAddress}`
  );
  const shareURL = encodeURIComponent(CONFIG.publicShareURL);
  const whatsappShare = `https://wa.me/?text=${shareText}%0A%0A${shareURL}`;

  const mapsURL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    CONFIG.mapsQuery
  )}`;

  async function handleSubmit(e) {
    e.preventDefault();
    if (already) {
      setStatus("ok");
      setSentTicket(already.ticketId);
      return;
    }
    setStatus("sending");

    const payload = {
      ...form,
      event: CONFIG.title,
      dateISO: CONFIG.dateISO,
      tz: CONFIG.TZ_STRING,
      location: `${CONFIG.locationLabel} — ${CONFIG.locationAddress}`,
      createdAt: new Date().toISOString(),
    };

  try {
    let ticketId = Math.random().toString(36).slice(2, 10);

    // --- Aquí reemplazas la lógica por Supabase ---
    const supabaseUrl = VITE_SUPABASE_URL?.replace(/\/+$/, ""); // sin slash final
    if (!supabaseUrl || !VITE_SUPABASE_ANON_KEY) {
      setStatus("error");
      console.error("[RSVP] Variables de entorno faltantes. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON en .env y reinicia.");
      return;
    }
    const res = await fetch(`${supabaseUrl}/rest/v1/rsvps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        event_slug: 'cumple-texzar-2025',
        name: form.name,
        email: form.email,
        phone: form.phone,
        attending: form.attending,
        guests: form.guests,
        message: form.message,
        ticket_id: ticketId
      })
    });

    const store = { ...payload, ticketId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    setSentTicket(ticketId);
    setStatus("ok");
    formRef.current?.reset();
  } catch (err) {
    console.error(err);
    setStatus("error");
  }

  const { VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY } = import.meta.env;

  // tras el insert OK en Supabase:
  try {
    await emailjs.send(
      VITE_EMAILJS_SERVICE_ID,
      VITE_EMAILJS_TEMPLATE_ID,
      {
        to_name: form.name,
        to_email: form.email,
        event_title: CONFIG.title,
        event_date: new Date(CONFIG.dateISO).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' }),
        event_location: `${CONFIG.locationLabel} — ${CONFIG.locationAddress}`,
        rsvp_status: form.attending,
        guests: form.guests,
        message: form.message,
        time: new Date().toLocaleString('es-MX'),
        maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.mapsQuery)}`,
      },
      { publicKey: VITE_EMAILJS_PUBLIC_KEY }
    );
    console.log('Correo de confirmación enviado ✅');
  } catch (mailErr) {
    console.warn('No se pudo enviar el correo de confirmación:', mailErr);
  }
  }
  

  function handleICS() {
    const ics = buildICS({
      title: CONFIG.title,
      description: `${CONFIG.inviteText}\n${CONFIG.hashtag}`,
      location: `${CONFIG.locationLabel}, ${CONFIG.locationAddress}`,
      startISO,
      endISO,
    });
    downloadFile("cumple.ics", ics, "text/calendar");
  }

  const gCalLink = googleCalendarURL({
    title: CONFIG.title,
    details: `${CONFIG.inviteText}\n${CONFIG.hashtag}`,
    location: `${CONFIG.locationLabel}, ${CONFIG.locationAddress}`,
    startISO,
    endISO,
  });

  // Mostrar splash antes de la invitación
  if (stage !== "invite") {
    return <Intro stage={stage} onSkip={() => setStage("invite")} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-600 text-gray-800">
      <GlobalStyles />
      {/* META OG para compartir (funciona en HTML final con <Head/> si usas Next.js) */}
      <MetaTags />

      {/* Hero */}
      <header className="relative">
        <img
          src={CONFIG.coverImage}
          alt="Cover"
          className="h-[65vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center pt-80">
          <div className="text-center text-white px-6">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow-xl">
              {CONFIG.title}
            </h1>
            <p className="mt-3 text-sm md:text-lg opacity-95 max-w-xl mx-auto">
              {CONFIG.inviteText}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
              <a
                href={gCalLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl px-3 py-1.5 text-sm bg-white text-gray-900 shadow hover:shadow-md transition"
              >
                Agregar a Google Calendar
              </a>
              <button
                onClick={handleICS}
                className="rounded-xl px-3 py-1.5 text-sm bg-white text-gray-900 shadow hover:shadow-md transition"
              >
                Descargar .ICS
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Info evento */}
      <section className="max-w-2xl mx-auto px-4 mt-2 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoItem
              label="Cuándo"
              value={new Intl.DateTimeFormat("es-MX", {
                dateStyle: "full",
                timeStyle: "short",
              }).format(new Date(startISO))}
            />
            <InfoItem label="Dónde" value={CONFIG.locationLabel} sub={CONFIG.locationAddress} />
            <InfoItem label="Código de vestimenta" value={CONFIG.dressCode} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={mapsURL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl px-4 py-2 border border-gray-300 hover:bg-gray-50"
            >
              Ver mapa
            </a>
            <a
              href={whatsappShare}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl px-4 py-2 border border-gray-300 hover:bg-gray-50"
            >
              Compartir por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Galería */}
      <section className="max-w-3xl mx-auto px-4 mt-6">
        <h3 className="text-base font-semibold text-white mb-2">Fotos</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-3 snap-x snap-mandatory">
            {CONFIG.photos.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`foto-${i + 1}`}
                className="h-40 w-64 object-cover rounded-xl snap-start flex-none border border-gray-200"
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-white mt-2">Tip: puedes deslizar horizontalmente.</p>
      </section>

      {/* RSVP */}
      <section className="max-w-2xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-1">Confirma tu asistencia</h2>
          <p className="text-sm text-gray-500 mb-4">
            {CONFIG.hostName} agradecerá tu confirmación. {CONFIG.allowCompanions && "Puedes indicar el número de acompañantes."}
          </p>

          {status === "ok" || already ? (
            <SuccessCard ticketId={sentTicket || already?.ticketId} phone={CONFIG.contactPhone} />
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Nombre completo"
                  required
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                />
                <Select
                  label="Método de contacto"
                  value={form.contactMethod}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      contactMethod: v,
                      // limpia el campo que no se usará
                      email: v === "email" ? f.email : "",
                      phone: v === "phone" ? f.phone : "",
                    }))
                  }
                  options={[
                    { v: "email", l: "Correo electrónico" },
                    { v: "phone", l: "Teléfono" },
                  ]}
                />

                {form.contactMethod === "email" && (
                  <Field
                    label="Correo"
                    type="email"
                    required
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  />
                )}

                {form.contactMethod === "phone" && (
                  <Field
                    label="Teléfono"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  />
                )}
                <Select
                  label="¿Asistirás?"
                  value={form.attending}
                  onChange={(v) => setForm((f) => ({ ...f, attending: v }))}
                  options={[{ v: "sí" }, { v: "no" }]}
                />
                {CONFIG.allowCompanions && (
                  <NumberField
                    label="Acompañantes"
                    min={0}
                    max={5}
                    value={form.guests}
                    onChange={(v) => setForm((f) => ({ ...f, guests: v }))}
                  />
                )}
              </div>
              <Textarea
                label="Mensaje (opcional)"
                value={form.message}
                onChange={(v) => setForm((f) => ({ ...f, message: v }))}
                placeholder="Deja un mensaje al cumpleañero..."
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-2xl bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 disabled:opacity-60"
              >
                {status === "sending" ? "Enviando..." : "Enviar confirmación"}
              </button>
              {status === "error" && (
                <p className="text-sm text-red-600 mt-2">
                  Ocurrió un error al enviar. Intenta de nuevo o escribe por WhatsApp.
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-xs text-gray-500">
        <p>
          Hecho con ❤️ — {CONFIG.hashtag}
        </p>
      </footer>
    </div>
  );
}

function InfoItem({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="font-medium leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{label}{required && " *"}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
      />
    </label>
  );
}

function NumberField({ label, value, onChange, min = 0, max = 10 }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20 bg-white"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l || o.v}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
      />
    </label>
  );
}

function SuccessCard({ ticketId, phone }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
      <p className="font-medium">¡Gracias! Tu asistencia quedó registrada.</p>
      {ticketId && (
        <p className="text-sm text-gray-700 mt-1">Tu folio: <span className="font-mono">{ticketId}</span></p>
      )}
      <p className="text-xs text-gray-600 mt-2">
        Si necesitas actualizar datos, escríbenos por WhatsApp.
      </p>
      {phone && (
        <a
          href={`https://wa.me/${phone.replace(/[^\d]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-3 rounded-xl border px-3 py-2 hover:bg-white"
        >
          Abrir WhatsApp
        </a>
      )}
    </div>
  );
}

function MetaTags() {
  // Nota: En un proyecto real, mueve esto a <head>. Aquí se deja para referencia.
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#111827" />
      <meta name="description" content="Invitación de cumpleaños — confirma asistencia y agrega al calendario" />

      {/* Open Graph */}
      <meta property="og:title" content={CONFIG.title} />
      <meta property="og:description" content={CONFIG.inviteText} />
      <meta property="og:image" content={CONFIG.coverImage} />
      <meta property="og:url" content={CONFIG.publicShareURL} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={CONFIG.title} />
      <meta name="twitter:description" content={CONFIG.inviteText} />
      <meta name="twitter:image" content={CONFIG.coverImage} />
    </>
  );
}

// Animaciones mínimas para el splash (puedes mover esto a tu CSS)
function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes pop { 0% { transform: scale(.9); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
      .animate-fade { animation: fadeIn .6s ease both }
      .animate-pop  { animation: pop .6s ease both }
    `}</style>
  );
}
