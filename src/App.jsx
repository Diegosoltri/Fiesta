// Invitación Web de Bautizo — React + Tailwind (responsive)
// --------------------------------------------------------
// Adaptado de una plantilla de cumpleaños a una temática de Bautizo (Princesa Aurora).
//
// Cómo usar
// 1) Reemplaza las imágenes de placeholder en la sección de imports.
// 2) Cambia TODOS los valores en "CONFIG" para que coincidan con tu evento.
// 3) Asegúrate de cambiar el 'event_slug' en la función 'handleSubmit' si usas Supabase.
// 4) Despliega y comparte.
// --------------------------------------------------------

import { useMemo, useRef, useState, useEffect } from "react";
// --- 🔥 ¡ACCIÓN REQUERIDA! ---
// Reemplaza estas imágenes por las de tu evento.
// Te sugiero crear una carpeta /assets-bautizo para no confundirte.
import fondo from './assets/foto4.jpg'; // <-- REEMPLAZA
import fondo1 from "./assets/aurora1.jpeg"; // <-- REEMPLAZA
import fondo2 from "./assets/aurora10.jpeg"; // <-- REEMPLAZA
import fondo3 from "./assets/aurora3.jpeg";
import fondo4 from "./assets/aurora4.jpeg";
import fondo5 from "./assets/aurora5.jpeg";
import fondo6 from "./assets/aurora6.jpeg";
import fondo7 from "./assets/aurora7.jpeg";
import fondo8 from "./assets/aurora8.jpeg";
import portada from "./assets/pixar.png";

import auroraImg from "./assets/princesa.png"; // Imagen decorativa de la princesa
import vestimentaImg from "./assets/vestimenta.png"; // Imagen para el código de vestimenta
import emailjs from "@emailjs/browser";

// === ENV (Vite) ===
const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;
if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "[RSVP] Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON. Revisa tu .env y reinicia el dev server."
  );
}

// ====== CONFIGURACIÓN BÁSICA ======
// --- 🔥 ¡ACCIÓN REQUERIDA! ---
// Edita todos estos campos con la información de tu bautizo.
const CONFIG = {
  title: "Aurora", // Nombre de la festejada
  hostName: "Familia González Mena", // Nombre de los anfitriones (papás)
  parents: ["Amayranni Mena C.", "Fernando González B."],
  godparents: ["Mariana Sanchez X.", "Gael Mena C."],
  dateISO: "2026-02-22T12:00:00", // Fecha y hora del evento
  durationMinutes: 180, // 3 horas
  TZ_STRING: "America/Mexico_City",
  // Misa
  ceremonyLabel: "Parroquia de Nuestra Señora de Líbano",
  ceremonyAddress: "Boulevard Hermanos Serdán No. 220, Colonia Real del Monte",
  ceremonyMapsQuery:
    "Parroquia de Nuestra Señora de Líbano, Puebla",
  ceremonyMapsURL:
    "https://www.google.com/maps/place/Parroquia+de+Nuestra+Se%C3%B1ora+de+L%C3%ADbano/@19.0671186,-98.2261969,17z/data=!3m1!4b1!4m6!3m5!1s0x85cfc6ccfecc58d1:0x7f2dc3f394cafe4e!8m2!3d19.0671135!4d-98.223622!16s%2Fg%2F1tnhyn_y?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D",

  // Fiesta
  partyLabel: "Salón Lotto",
  partyAddress: "Avenida 15 de Mayo No.3948, Colonia Villa Posada",
  partyMapsQuery: "Lotto salón jardín",
  partyMapsURL: "https://www.google.com/maps/place/Lotto+sal%C3%B3n+jard%C3%ADn/@19.0720221,-98.2242909,17z/data=!3m1!4b1!4m6!3m5!1s0x85cfc6cb31eaddb3:0xdcec92f31582cb7f!8m2!3d19.072017!4d-98.221716!16s%2Fg%2F1ptyynqnd?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D",
  coverImage: portada, // Imagen de portada
  photos: [fondo1, fondo2, fondo4, fondo, fondo5, fondo6, fondo7, fondo8], // Agrega más fotos importadas arriba
  // Texto de invitación
  inviteText:
    "Tenemos el honor de invitarte a celebrar con nosotros el sagrado bautizo de nuestra querida hija.",
  dressCode: "Rosa/Azul",
  hashtag: "BautizoDeAurora",
  // RSVP
  RSVP_ENDPOINT: "", // Pega tu URL de Formspree aquí si no usas Supabase
  allowCompanions: true,
  contactPhone: "+522224908225", // Teléfono de contacto para WhatsApp
  // Enlace público que compartirás (para botón de WhatsApp)
  publicShareURL: "https://fiesta-dusky.vercel.app",
};

// ====== UTILIDADES FECHA/CALENDARIOS ======
// (Sin cambios en esta sección)
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
  const uid = `${Date.now()}@invite`;
  const dtstamp = icsDateUTC(new Date().toISOString());
  const dtstart = icsDateUTC(startISO);
  const dtend = icsDateUTC(endISO);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:-//Bautizo Invite//ES",
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

// === Cuenta regresiva mágica ===
function getTimeRemaining(targetISO) {
  const target = new Date(targetISO).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
    };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, isPast: false };
}

// ====== INTRO (splash) ======
// --- ✨ CAMBIOS DE TEMA AQUÍ ---
function Intro({ stage, onSkip }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pink-400 via-pink-500 to-blue-400 text-white flex items-center justify-center relative overflow-hidden">
      {/* Botón Saltar */}
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 text-xs rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 backdrop-blur-sm"
      >
        Saltar
      </button>

      {/* Destellos de magia de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <span className="magic-sparkle top-10 left-6" />
        <span className="magic-sparkle top-1/4 right-8 delay-100" />
        <span className="magic-sparkle bottom-10 left-1/3 delay-200" />
        <span className="magic-sparkle bottom-20 right-1/4 delay-300" />
      </div>

      {stage === "introMessage" && (
        <div className="text-center animate-fade bg-white/10 text-white px-8 py-6 rounded-3xl shadow-xl max-w-xs mx-auto backdrop-blur-sm">
          <p className="text-xs tracking-[0.25em] uppercase opacity-80">
            Un día mágico
          </p>
          <h1 className="mt-3 text-3xl font-bold">Estás invitado</h1>
          <p className="mt-2 text-sm text-white/80">
            Descubre los detalles y confirma tu asistencia ✨
          </p>
        </div>
      )}

      {stage === "introIcon" && (
        <div className="text-center animate-pop">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-white/15 backdrop-blur-sm shadow-2xl magic-orbit">
            {/* Icono de corona de princesa */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-14 h-14"
              fill="currentColor"
            >
              <path d="M4 19h16l-1.2-7.2-3.1 3.1-3.7-7.3-3.7 7.3-3.1-3.1L4 19zm8-12.5 2 2 2-2-2-2-2 2zm-6 2.5 1.5-1.5L6 6 4.5 7.5 6 9zm12 0 1.5-1.5L18 6l-1.5 1.5L18 9zM3 21v-2h18v2H3z" />
            </svg>
          </div>
          <p className="mt-4 text-base">Preparando la magia… ✨</p>
        </div>
      )}
    </div>
  );
}

// ====== COMPONENTE PRINCIPAL ======
export default function BaptismInvite() {
  const startISO = CONFIG.dateISO;
  const endISO = addMinutes(CONFIG.dateISO, CONFIG.durationMinutes);

  const [countdown, setCountdown] = useState(() => getTimeRemaining(startISO));

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(getTimeRemaining(startISO));
    }, 1000);
    return () => clearInterval(id);
  }, [startISO]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    attending: "si",
    guests: 0,
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | ok | error
  const [sentTicket, setSentTicket] = useState(null);
  const [isWhatsAppConfirmOpen, setIsWhatsAppConfirmOpen] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  useEffect(() => {
    if (status === "ok") {
      setIsWhatsAppConfirmOpen(true);
    }
  }, [status]);
  // Slider de fotos
  const [photoIndex, setPhotoIndex] = useState(0);
  const totalPhotos = CONFIG.photos.length;
  const [isMapOpen, setIsMapOpen] = useState(false);

  const nextPhoto = () => {
    setPhotoIndex((prev) => (prev + 1) % totalPhotos);
  };

  const prevPhoto = () => {
    setPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };
  const formRef = useRef(null);

  // Intro splash control
  const [stage, setStage] = useState("introMessage");
  useEffect(() => {
    const t1 = setTimeout(() => setStage("introIcon"), 2300);
    const t2 = setTimeout(() => setStage("invite"), 4600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Idempotencia
  const STORAGE_KEY = useMemo(
    () => `rsvp-${btoa(CONFIG.title).slice(0, 8)}`,
    []
  );

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
    `${CONFIG.title} — ${CONFIG.inviteText}\n\nCuándo: ${eventParts.dd}/${eventParts.mm}/${eventParts.yyyy} a las ${eventParts.hh}:${eventParts.min} (${CONFIG.TZ_STRING})\n\nMisa: ${CONFIG.ceremonyLabel} — ${CONFIG.ceremonyAddress}\nFiesta: ${CONFIG.partyLabel} — ${CONFIG.partyAddress}`
  );
  const shareURL = encodeURIComponent(CONFIG.publicShareURL);
  const whatsappShare = `https://wa.me/?text=${shareText}%0A%0A${shareURL}`;

  const ceremonyMapsURL = CONFIG.ceremonyMapsURL
    ? CONFIG.ceremonyMapsURL
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        CONFIG.ceremonyMapsQuery || CONFIG.ceremonyLabel
      )}`;

  const partyMapsURL = CONFIG.partyMapsURL
    ? CONFIG.partyMapsURL
    : CONFIG.partyMapsQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        CONFIG.partyMapsQuery
      )}`
    : "";

  async function handleSubmit(e) {
    e.preventDefault();
    if (already) {
      setStatus("ok");
      setSentTicket(already.ticketId);
      return;
    }
    setStatus("sending");

    const payload = {
      name: form.name,
      phone: form.phone,
      attending: form.attending,
      guests: CONFIG.allowCompanions ? Number(form.guests || 0) : 0,
      message: form.message,
      event: CONFIG.title,
      dateISO: CONFIG.dateISO,
      tz: CONFIG.TZ_STRING,
      location: `Misa: ${CONFIG.ceremonyLabel} — ${CONFIG.ceremonyAddress} | Fiesta: ${CONFIG.partyLabel} — ${CONFIG.partyAddress}`,
      createdAt: new Date().toISOString(),
    };

    try {
      let ticketId = Math.random().toString(36).slice(2, 10);

      // --- Lógica de Supabase (o Formspree si se usa) ---
      const supabaseUrl = VITE_SUPABASE_URL?.replace(/\/+$/, "");
      if (!supabaseUrl || !VITE_SUPABASE_ANON_KEY) {
        // --- Modo Demo / Formspree ---
        if (CONFIG.RSVP_ENDPOINT) {
          // Lógica de Formspree
          await fetch(CONFIG.RSVP_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          // Modo demo si no hay endpoint
          console.log("Modo Demo (sin endpoint). Payload:", payload);
          await new Promise(res => setTimeout(res, 1000)); // Simular red
        }
      } else {
        // --- Modo Supabase ---
        await fetch(`${supabaseUrl}/rest/v1/rsvps`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${VITE_SUPABASE_ANON_KEY}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            // --- 🔥 ¡ACCIÓN REQUERIDA! ---
            // Asegúrate que este 'event_slug' coincida con tu tabla de Supabase.
            event_slug: "bautizo-aurora-2026", // <-- CAMBIA ESTO
            name: form.name,
            phone: form.phone,
            attending: form.attending,
            guests: CONFIG.allowCompanions ? Number(form.guests || 0) : 0,
            message: form.message,
            ticket_id: ticketId,
          }),
        });
      }

      const store = { ...payload, ticketId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      setSentTicket(ticketId);
      setStatus("ok");
      formRef.current?.reset();

    } catch (err) {
      console.error(err);
      setStatus("error");
    }

    // --- Lógica de Email.js (opcional) ---
    const {
      VITE_EMAILJS_SERVICE_ID,
      VITE_EMAILJS_TEMPLATE_ID,
      VITE_EMAILJS_PUBLIC_KEY,
    } = import.meta.env;

    if (
      VITE_EMAILJS_SERVICE_ID &&
      VITE_EMAILJS_TEMPLATE_ID &&
      VITE_EMAILJS_PUBLIC_KEY &&
      form.email // Solo si el contacto es por email
    ) {
      try {
        await emailjs.send(
          VITE_EMAILJS_SERVICE_ID,
          VITE_EMAILJS_TEMPLATE_ID,
          {
            to_name: form.name,
            to_email: form.email,
            event_title: CONFIG.title,
            event_date: new Date(CONFIG.dateISO).toLocaleString("es-MX", {
              dateStyle: "full",
              timeStyle: "short",
            }),
            event_location: `Misa: ${CONFIG.ceremonyLabel} — ${CONFIG.ceremonyAddress} | Fiesta: ${CONFIG.partyLabel} — ${CONFIG.partyAddress}`,
            rsvp_status: form.attending,
            guests: form.guests,
            message: form.message,
            time: new Date().toLocaleString("es-MX"),
            maps_url: ceremonyMapsURL,
          },
          { publicKey: VITE_EMAILJS_PUBLIC_KEY }
        );
        console.log("Correo de confirmación enviado ✅");
      } catch (mailErr) {
        console.warn("No se pudo enviar el correo de confirmación:", mailErr);
      }
    }
  }

  function handleICS() {
    const ics = buildICS({
      title: CONFIG.title,
      description: `${CONFIG.inviteText}\n${CONFIG.hashtag}`,
      location: `Misa: ${CONFIG.ceremonyLabel}, ${CONFIG.ceremonyAddress} | Fiesta: ${CONFIG.partyLabel}, ${CONFIG.partyAddress}`,
      startISO,
      endISO,
    });
    downloadFile("bautizo.ics", ics, "text/calendar");
  }

  const gCalLink = googleCalendarURL({
    title: CONFIG.title,
    details: `${CONFIG.inviteText}\n${CONFIG.hashtag}`,
    location: `Misa: ${CONFIG.ceremonyLabel}, ${CONFIG.ceremonyAddress} | Fiesta: ${CONFIG.partyLabel}, ${CONFIG.partyAddress}`,
    startISO,
    endISO,
  });

  if (stage !== "invite") {
    return <Intro stage={stage} onSkip={() => setStage("invite")} />;
  }

  // --- ✨ CAMBIOS DE TEMA AQUÍ ---
  return (
    // Fondo degradado de Rosa a Azul
    <div className="min-h-screen bg-gradient-to-b from-pink-300 to-blue-300 text-gray-800">
      <GlobalStyles />
      <MetaTags />

      {/* Hero */}
      <header className="relative">
        <img
          src={CONFIG.coverImage}
          alt="Bautizo de Aurora"
          className="h-[65vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6 pt-16">
            <h1
              className="text-5xl md:text-8xl font-extrabold drop-shadow-xl"
              style={{ fontFamily: "'Berkshire Swash', cursive" }}
            >
              {CONFIG.title}
            </h1>
            <p className="mt-2 text-sm md:text-lg tracking-[0.22em] uppercase text-white/90 font-semibold">
              Mi bautizo y primer año
            </p>
            {/* <p className="mt-3 text-md md:text-lg opacity-95 max-w-xl mx-auto">
              {CONFIG.inviteText}
            </p> */}


            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {/* <a
                href={gCalLink}
                target="_blank"
                rel="noreferrer"
                // Botones con acento rosa
                className="rounded-xl px-3 py-1.5 text-sm bg-white text-pink-700 font-medium shadow hover:bg-pink-50 transition"
              >
                Agregar a Google Calendar
              </a>
              <button
                onClick={handleICS}
                className="rounded-xl px-3 py-1.5 text-sm bg-white text-pink-700 font-medium shadow hover:bg-pink-50 transition"
              >
                Descargar .ICS
              </button> */}
            </div>
          </div>
        </div>
      </header>

      {/* Info evento */}
      <section className="max-w-2xl mx-auto px-4 -mt-12 relative z-10">
        <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl border border-pink-200/70 shadow-lg p-5 md:p-6 magic-border">
          <span className="magic-sparkle top-1 left-6" />
          <span className="magic-sparkle bottom-1 right-10 delay-200" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoItem
              label="Te esperamos"
              value={
                <span className="inline-flex items-center gap-2">
                  <span>
                    {(() => {
                      const s = new Intl.DateTimeFormat("es-MX", {
                        dateStyle: "full",
                      }).format(new Date(startISO));
                      return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
                    })()}
                  </span>
                  <span className="inline-block text-6xl leading-none">🎉</span>
                </span>
              }
            />
            <div className="space-y-4">
            <InfoItem
              label="Misa ⛪ · 12:00pm"
              value={CONFIG.ceremonyLabel}
              sub={CONFIG.ceremonyAddress}
            />
            <InfoItem
              label="Recepción 🏰 · 1:30pm"
              value={CONFIG.partyLabel}
              sub={CONFIG.partyAddress}
            />
          </div>
            {/* Vestimenta con ilustración */}
            <div className="rounded-xl border border-pink-200/70 bg-white/30 backdrop-blur-md p-4 flex items-center gap-3 magic-border subtle">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-pink-600">
                  Vestimenta
                </p>
                <p className="font-medium leading-tight">
                  {CONFIG.dressCode}
                </p>
              </div>
              <div className="w-16 md:w-20 lg:w-24 flex-shrink-0">
                <img
                  src={vestimentaImg}
                  alt="Código de vestimenta rosa y azul"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="rounded-xl px-4 py-2 border border-pink-300 text-pink-700 hover:bg-pink-50 transition"
            >
              Ubicación
            </button>
            <button
              type="button"
              onClick={() => setIsGiftOpen(true)}
              className="rounded-xl px-4 py-2 border border-pink-300 text-pink-700 hover:bg-pink-50 transition inline-flex items-center gap-2"
            >
              <span className="text-lg leading-none">✉️</span>
              Regalo
            </button>
            <a
              href={whatsappShare}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl px-4 py-2 border border-pink-300 text-pink-700 hover:bg-pink-50 transition"
            >
              Compartir por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Sección de agradecimiento a papás y padrinos */}
      <section className="max-w-2xl mx-auto px-4 mt-6">
        <div className="relative overflow-hidden rounded-3xl border border-pink-200/70 bg-white/40 backdrop-blur-md shadow-lg px-6 py-5 text-center magic-border">
          <span className="magic-sparkle top-1 left-6" />
          <span className="magic-sparkle bottom-1 right-10 delay-200" />

          <p className="text-xs uppercase tracking-[0.25em] text-pink-500 mb-2">
            Con mucho cariño
          </p>

          <p className="mt-3 text-xl md:text-2xl font-extrabold text-purple-700 drop-shadow-sm">
            Gracias por estar aquí y acompañarme en mi bautizo y primer año de vida.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-pink-600 mb-1 inline-flex items-center gap-2">
                Mis papás
                <span className="text-2xl leading-none">🎀</span>
              </p>
              {CONFIG.parents.map((p) => (
                <p key={p} className="font-medium">
                  {p}
                </p>
              ))}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-pink-600 mb-1 inline-flex items-center gap-2">
                Mis padrinos
                <span className="text-2xl leading-none">✨</span>
              </p>
              {CONFIG.godparents.map((g) => (
                <p key={g} className="font-medium">
                  {g}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Galería / Recuerdos mágicos */}
      <section className="max-w-md md:max-w-3xl mx-auto px-4 mt-10">
        <h3 className="text-lg font-semibold text-white mb-3 text-center">
          Recuerdos mágicos ✨
        </h3>

        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/40 backdrop-blur-md magic-border subtle">
          {/* Capa de destellos */}
          <div className="pointer-events-none absolute inset-0">
            <span className="magic-sparkle top-4 left-6" />
            <span className="magic-sparkle bottom-6 right-10 delay-150" />
          </div>

          {/* Foto principal */}
          <div className="aspect-[4/5] md:aspect-[16/9] w-full relative">
            <img
              src={CONFIG.photos[photoIndex]}
              alt={`foto-${photoIndex + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Degradado inferior para texto y controles */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 flex flex-col gap-2">
              <p className="text-xs text-white/80">
                Foto {photoIndex + 1} de {totalPhotos}
              </p>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs text-white backdrop-blur-sm"
                >
                  ◀ Anterior
                </button>
                <div className="flex gap-2">
                  {CONFIG.photos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoIndex(i)}
                      className={`h-2.5 w-2.5 rounded-full border border-white/60 transition ${
                        i === photoIndex ? "bg-white" : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs text-white backdrop-blur-sm"
                >
                  Siguiente ▶
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/80 mt-3 text-center">
          Desliza con los puntos o usa los botones para ver más momentos especiales.
        </p>
      </section>

      {/* Cuenta regresiva mágica */}
      {!countdown.isPast && (
        <section className="max-w-md md:max-w-3xl mx-auto px-4 mt-10">
          <div className="relative overflow-hidden rounded-3xl border border-pink-200/70 bg-white/40 backdrop-blur-md shadow-2xl px-6 py-5 flex flex-col md:flex-row items-center gap-4 md:gap-8 text-pink-700 magic-border">
            {/* Destellos decorativos */}
            <span className="magic-sparkle top-2 left-6" />
            <span className="magic-sparkle bottom-2 right-8 delay-200" />

            {/* Princesa decorativa */}
            <div className="w-32 md:w-40 lg:w-48 flex-shrink-0 mb-2 md:mb-0">
              <img
                src={auroraImg}
                alt="Princesa Aurora"
                className="w-full h-auto drop-shadow-xl"
              />
            </div>

            <div className="flex-1 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2 mb-3">
                {/* Icono coronita */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                  fill="currentColor"
                >
                  <path d="M5 18h14l-1.2-7.2-3.3 3.3-3.5-7-3.5 7-3.3-3.3L5 18zm-2 2v-2l.2-1.1L4 10l4 4 4-8 4 8 4-4 1 6.9.2 1.1v2H3z" />
                </svg>
                <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-pink-500">
                  Cuenta regresiva
                </p>
              </div>

              <div className="flex justify-center md:justify-start gap-4 md:gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-bold">
                    {countdown.days}
                  </span>
                  <span className="text-[11px] md:text-xs uppercase tracking-wide text-pink-500">
                    días
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-bold">
                    {countdown.hours}
                  </span>
                  <span className="text-[11px] md:text-xs uppercase tracking-wide text-pink-500">
                    hrs
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-bold">
                    {countdown.minutes}
                  </span>
                  <span className="text-[11px] md:text-xs uppercase tracking-wide text-pink-500">
                    min
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[11px] md:text-xs text-pink-500/80 text-center md:text-left">
                para el gran día de Aurora ✨
              </p>
            </div>
          </div>
        </section>
      )}

      {/* RSVP */}
      <section className="max-w-2xl mx-auto px-4 mt-8">
        <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl border border-pink-200/70 shadow-xl p-6 magic-border">
          <span className="magic-sparkle -top-2 left-4" />
          <span className="magic-sparkle bottom-0 right-6 delay-200" />
          <h2 className="text-xl font-semibold mb-1">Confirma tu asistencia</h2>
          <p className="text-sm text-gray-500 mb-4">
            {CONFIG.hostName} agradecerá tu confirmación.
          </p>

          {status === "ok" || already ? (
            <SuccessCard
              ticketId={sentTicket || already?.ticketId}
              phone={CONFIG.contactPhone}
              onConfirmWhatsApp={() => setIsWhatsAppConfirmOpen(true)}
            />
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Nombre completo"
                  required
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                />
                <Field
                  label="Teléfono"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                />
                <Select
                  label="¿Asistirás?"
                  value={form.attending}
                  onChange={(v) => setForm((f) => ({ ...f, attending: v }))}
                  options={[
                    { v: "si", l: "Sí" },
                    { v: "no", l: "No" },
                  ]}
                />
                {CONFIG.allowCompanions && form.attending === "si" && (
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
                placeholder="Deja un mensaje para Aurora y su familia..."
              />
              <button
                type="submit"
                disabled={status === "sending"}
                // Botón principal en rosa
                className="w-full rounded-full bg-pink-600 text-white py-3 font-medium shadow-md hover:bg-pink-700 disabled:opacity-60 transition"
              >
                {status === "sending" ? "Enviando..." : "Enviar confirmación"}
              </button>
              {status === "error" && (
                <p className="text-sm text-red-600 mt-2">
                  Ocurrió un error al enviar. Intenta de nuevo o escribe por
                  WhatsApp.
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-xs text-white/70">
        <p>
          Hecho con ❤️ — {CONFIG.hashtag}
        </p>
      </footer>

      {/* Modal de ubicaciones (Misa / Fiesta) */}
      <MapModal
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        ceremonyLabel={CONFIG.ceremonyLabel}
        ceremonyAddress={CONFIG.ceremonyAddress}
        ceremonyURL={ceremonyMapsURL}
        partyLabel={CONFIG.partyLabel}
        partyAddress={CONFIG.partyAddress}
        partyURL={partyMapsURL}
      />

      {/* Mini modal: confirmar por WhatsApp */}
      <WhatsAppConfirmModal
        open={isWhatsAppConfirmOpen}
        onClose={() => setIsWhatsAppConfirmOpen(false)}
        phone={CONFIG.contactPhone}
        name={form.name}
        ticketId={sentTicket || already?.ticketId}
      />

      {/* Mini modal: método de regalo */}
      <GiftModal open={isGiftOpen} onClose={() => setIsGiftOpen(false)} />
    </div>
  );
}

function MapModal({
  open,
  onClose,
  ceremonyLabel,
  ceremonyAddress,
  ceremonyURL,
  partyLabel,
  partyAddress,
  partyURL,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-3xl border border-pink-200/70 bg-white/60 backdrop-blur-md shadow-2xl p-5 magic-border">
        <span className="magic-sparkle top-2 left-6" />
        <span className="magic-sparkle bottom-2 right-8 delay-200" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-pink-500">
              Ubicaciones
            </p>
            <h3 className="text-xl font-semibold text-pink-700">
              ¿A dónde vamos? ✨
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/60 hover:bg-white/80 border border-pink-200/70 px-3 py-1 text-sm text-pink-700"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-pink-200/70 bg-white/40 backdrop-blur-md p-4">
            <p className="text-xs uppercase tracking-wide text-pink-600">
              Misa ⛪
            </p>
            <p className="font-medium">{ceremonyLabel}</p>
            <p className="text-xs text-gray-600 mt-1">{ceremonyAddress}</p>
            <a
              href={ceremonyURL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex mt-3 rounded-xl px-4 py-2 border border-pink-300 text-pink-700 hover:bg-pink-50 transition"
            >
              Abrir mapa
            </a>
          </div>

          <div className="rounded-2xl border border-pink-200/70 bg-white/40 backdrop-blur-md p-4">
            <p className="text-xs uppercase tracking-wide text-pink-600">
              Recepción 🏰
            </p>
            <p className="font-medium">{partyLabel}</p>
            <p className="text-xs text-gray-600 mt-1">{partyAddress}</p>

            {partyURL ? (
              <a
                href={partyURL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex mt-3 rounded-xl px-4 py-2 border border-pink-300 text-pink-700 hover:bg-pink-50 transition"
              >
                Abrir mapa
              </a>
            ) : (
              <p className="text-xs text-pink-600 mt-3">
                (Falta agregar el link del mapa de la fiesta)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function WhatsAppConfirmModal({ open, onClose, phone, name, ticketId }) {
  if (!open) return null;
  const digits = String(phone || "").replace(/[^\d]/g, "");
  const msg = `Hola${name ? `, soy ${name}` : ""}. Confirmo mi asistencia.${ticketId ? ` Folio: ${ticketId}` : ""}`;
  const waLink = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-3xl border border-pink-200/70 bg-white/70 backdrop-blur-md shadow-2xl p-5 magic-border">
        <span className="magic-sparkle top-2 left-6" />
        <span className="magic-sparkle bottom-2 right-8 delay-200" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-pink-500">
              Confirmación
            </p>
            <h3 className="text-xl font-semibold text-pink-700">
              Vamos a abrir WhatsApp ✨
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/70 hover:bg-white/90 border border-pink-200/70 px-3 py-1 text-sm text-pink-700"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-pink-200/70 bg-white/50 backdrop-blur-md p-4 text-left">
          <p className="text-sm text-gray-700">
            Escribe <span className="font-semibold text-pink-700">“Confirmo”</span> en el chat para terminar tu confirmación.
          </p>
          {ticketId && (
            <p className="text-xs text-gray-600 mt-2">
              Tu folio: <span className="font-mono">{ticketId}</span>
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-pink-300 text-pink-700 px-4 py-2 hover:bg-pink-50 transition"
          >
            Ahora no
          </button>
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:flex-1 text-center rounded-xl bg-pink-600 text-white px-4 py-2 hover:bg-pink-700 transition"
            >
              Abrir WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:flex-1 text-center rounded-xl bg-pink-600 text-white px-4 py-2 opacity-60"
            >
              Abrir WhatsApp
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-600">
          Nota: WhatsApp no permite enviar mensajes automáticos; por eso necesitas escribirlo tú.
        </p>
      </div>
    </div>
  );
}

// --- ✨ CAMBIOS DE TEMA AQUÍ ---
function InfoItem({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-pink-200/70 bg-white/30 backdrop-blur-md p-4 magic-border subtle">
      <p className="text-xs uppercase tracking-wide text-pink-600">{label}</p>
      <p className="font-medium leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// --- ✨ CAMBIOS DE TEMA AQUÍ ---
// Componentes de formulario con focus rosa
function Field({ label, value, onChange, type = "text", required }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">
        {label}
        {required && " *"}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-pink-100 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300/60"
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
        className="mt-1 w-full rounded-xl border border-pink-100 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300/60"
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
        className="mt-1 w-full rounded-xl border border-pink-100 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300/60"
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
        className="mt-1 w-full rounded-xl border border-pink-100 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300/60"
      />
    </label>
  );
}

// --- ✨ CAMBIOS DE TEMA AQUÍ ---
// Tarjeta de éxito en tono azul
function SuccessCard({ ticketId, phone, onConfirmWhatsApp }) {
  return (
    <div className="rounded-2xl border border-blue-200/70 bg-white/40 backdrop-blur-md p-4 shadow-md magic-border subtle-blue">
      <p className="font-medium text-blue-800">
        ¡Gracias! Tu asistencia quedó registrada.
      </p>
      {ticketId && (
        <p className="text-sm text-blue-700 mt-1">
          Tu folio: <span className="font-mono">{ticketId}</span>
        </p>
      )}
      <p className="text-xs text-blue-600 mt-2">
        Si necesitas actualizar datos, escríbenos por WhatsApp.
      </p>
      {phone && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onConfirmWhatsApp}
            className="rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
          >
            Confirmar por WhatsApp
          </button>
          <a
            href={`https://wa.me/${phone.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-blue-300 text-blue-700 px-4 py-2 hover:bg-white"
          >
            Abrir WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

function MetaTags() {
  // Nota: En un proyecto real, mueve esto a <head>.
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#F472B6" />
      <meta
        name="description"
        content="Invitación de bautizo — confirma asistencia y agrega al calendario"
      />

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

// Animaciones mínimas para el splash
function GlobalStyles() {
  return (
    <style>{`
      /* Opcional: Importa una fuente cursiva bonita para el título */
      @import url('https://fonts.googleapis.com/css2?family=Berkshire+Swash&display=swap');

      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes pop { 0% { transform: scale(.9); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
      .animate-fade { animation: fadeIn .6s ease both }
      .animate-pop  { animation: pop .6s ease both }

      @keyframes sparkle {
        0% { transform: scale(0.8) translateY(0); opacity: 0; }
        30% { opacity: 1; }
        70% { opacity: 1; }
        100% { transform: scale(1.2) translateY(-6px); opacity: 0; }
      }

      @keyframes orbit {
        0% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-6px) scale(1.03); }
        100% { transform: translateY(0) scale(1); }
      }

      .magic-sparkle {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 9999px;
        background: radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0) 60%);
        box-shadow: 0 0 12px rgba(255,255,255,0.9);
        animation: sparkle 2.2s infinite ease-in-out;
      }

      .magic-sparkle.delay-100 { animation-delay: 0.4s; }
      .magic-sparkle.delay-150 { animation-delay: 0.6s; }
      .magic-sparkle.delay-200 { animation-delay: 0.8s; }
      .magic-sparkle.delay-300 { animation-delay: 1s; }

      .magic-orbit {
        animation: orbit 2.4s ease-in-out infinite;
      }
    `}</style>
  );
}
function GiftModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-3xl border border-pink-200/70 bg-white/70 backdrop-blur-md shadow-2xl p-5 magic-border">
        <span className="magic-sparkle top-2 left-6" />
        <span className="magic-sparkle bottom-2 right-8 delay-200" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-pink-500">
              Regalo
            </p>
            <h3 className="text-xl font-semibold text-pink-700">
              Método de regalo ✨
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/70 hover:bg-white/90 border border-pink-200/70 px-3 py-1 text-sm text-pink-700"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-pink-200/70 bg-white/50 backdrop-blur-md p-4 text-left">
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none">✉️</span>
            <div>
              <p className="text-sm text-gray-700">Método de regalo:</p>
              <p className="text-lg font-extrabold text-purple-700">
                Sobre sorpresa
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-600">¡Gracias por tu cariño! 💖</p>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-pink-600 text-white px-4 py-2 hover:bg-pink-700 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}