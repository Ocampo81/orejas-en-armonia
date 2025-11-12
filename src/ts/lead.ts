// src/ts/lead.ts

type LeadPayload = {
  name: string;
  whatsapp: string;   // E.164 (+573001234567)
  message: string;
  source?: string;
};

type CountryDial = { name: string; code: string; iso2: string };

// ============ CONFIG ============
const API_BASE = "http://127.0.0.1:8000";
const WA_DEST  = "573150002596";

// Fallback si la API de países falla
const FALLBACK_COUNTRIES: CountryDial[] = [
  { name: "Colombia",        code: "+57",  iso2: "CO" },
  { name: "Estados Unidos",  code: "+1",   iso2: "US" },
  { name: "México",          code: "+52",  iso2: "MX" },
  { name: "España",          code: "+34",  iso2: "ES" },
  { name: "Argentina",       code: "+54",  iso2: "AR" },
  { name: "Chile",           code: "+56",  iso2: "CL" },
  { name: "Perú",            code: "+51",  iso2: "PE" },
  { name: "Ecuador",         code: "+593", iso2: "EC" },
  { name: "Venezuela",       code: "+58",  iso2: "VE" },
  { name: "Brasil",          code: "+55",  iso2: "BR" },
];

// ============ UTILS UI ============
function qs<T extends HTMLElement>(sel: string): T {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`No se encontró ${sel}`);
  return el as T;
}
function toast(msg: string, ok = true) {
  const el = document.createElement("div");
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed", left: "50%", bottom: "22px", transform: "translateX(-50%)",
    padding: "12px 16px", borderRadius: "10px", color: "#fff",
    background: ok ? "#22b3a5" : "#e11d48", boxShadow: "0 8px 20px rgba(0,0,0,.18)", zIndex: "9999"
  } as CSSStyleDeclaration);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function setErr(forKey: "name" | "country" | "phone", msg: string) {
  const small = document.querySelector<HTMLSpanElement>(
    forKey === "name"
      ? '.err[data-err-for="name"]'
      : forKey === "country"
      ? '.err[data-err-for="country"]'
      : '.err[data-err-for="phone"]'
  );
  if (small) { small.textContent = msg; small.style.color = "#b91c1c"; small.style.fontWeight = "600"; }
}
function clearErrs() {
  document.querySelectorAll<HTMLSpanElement>(".err").forEach((el) => (el.textContent = ""));
}

// ============ VALIDACIÓN ============
const onlyDigits = (s: string) => s.replace(/\D+/g, "");
function isValidLocalNumber(s: string) {
  const d = onlyDigits(s);
  return d.length >= 6 && d.length <= 12;
}

// ============ BACKEND ============
async function sendLead(payload: LeadPayload) {
  const res = await fetch(`${API_BASE}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    mode: "cors",
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ============ WHATSAPP ============
function openWhatsApp(name: string, phoneFull: string, message: string) {
  const text = `Hola, soy ${name}. ${message ? message : "Me gustaría agendar una valoración."} Mi WhatsApp es ${phoneFull}.`;
  const url = `https://wa.me/${WA_DEST}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}

// ============ PAÍSES (API + timeout) ============
function withTimeout<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function loadCountries(): Promise<CountryDial[]> {
  try {
    const url = "https://restcountries.com/v3.1/all?fields=name,cca2,idd";
    const res = await withTimeout(fetch(url), 4000);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();

    const out: CountryDial[] = [];
    for (const c of data) {
      const root = c?.idd?.root as string | undefined;
      const suffixes = c?.idd?.suffixes as string[] | undefined;
      if (!root || !suffixes || !suffixes.length) continue;
      out.push({
        name: c?.name?.common || c?.name?.official || "—",
        code: `${root}${suffixes[0]}`,
        iso2: c?.cca2 || "",
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (!out.some((x) => x.iso2 === "CO")) out.push({ name: "Colombia", code: "+57", iso2: "CO" });
    return out;
  } catch (e) {
    console.warn("Fallo API de países, usando fallback:", e);
    return FALLBACK_COUNTRIES.slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
}

function populateCountrySelect(select: HTMLSelectElement, list: CountryDial[]) {
  select.innerHTML = `<option value="" disabled selected>Selecciona tu país…</option>`;
  for (const c of list) {
    const opt = document.createElement("option");
    opt.value = c.code;
    opt.textContent = `${c.name} (${c.code})`;
    opt.dataset.iso2 = c.iso2;
    select.appendChild(opt);
  }
  const co = Array.from(select.options).find((o) => o.dataset.iso2 === "CO");
  if (co) select.value = co.value;
}

// ============ INIT ============
function initLeadForm() {
  console.log("[lead.js] cargado");

  const form = document.getElementById("lead-form") as HTMLFormElement | null;
  if (!form) return;

  const name = qs<HTMLInputElement>("#lead-name");
  const countrySel = qs<HTMLSelectElement>("#lead-country");
  const waLocal = qs<HTMLInputElement>("#lead-wa");
  const msg = qs<HTMLTextAreaElement>("#lead-msg");
  const btn = qs<HTMLButtonElement>("#lead-submit");
  const dialBadge = qs<HTMLSpanElement>("#dial-badge");

  // Cargar países
  loadCountries().then((list) => {
    populateCountrySelect(countrySel, list);
    // Sincronizar prefijo inicial por si cambia la preselección
    if (countrySel.value) dialBadge.textContent = countrySel.value;
  });

  // 1) Actualizar el prefijo al cambiar país
  countrySel.addEventListener("change", () => {
    const code = countrySel.value || "+";
    dialBadge.textContent = code;
  });

  // 2) Solo dígitos en el input local (en vivo)
  waLocal.addEventListener("input", () => {
    const selStart = waLocal.selectionStart || 0;
    const before = waLocal.value;
    const after = onlyDigits(before);
    if (before !== after) {
      waLocal.value = after;
      // restitución simple del cursor
      waLocal.setSelectionRange(Math.min(selStart - 1, after.length), Math.min(selStart - 1, after.length));
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrs();

    const nameVal = name.value.trim();
    const countryCode = countrySel.value;      // "+57"
    const localRaw = waLocal.value.trim();     // "3001234567"
    const msgVal = msg.value.trim();

    let hasError = false;
    if (nameVal.length < 2) { setErr("name", "Escribe tu nombre."); hasError = true; }
    if (!countryCode) { setErr("country", "Selecciona tu país."); hasError = true; }
    if (!isValidLocalNumber(localRaw)) { setErr("phone", "Número inválido (6–12 dígitos)."); hasError = true; }
    if (hasError) return;

    const fullPhone = `${countryCode}${localRaw}`;

    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = "Enviando…";

    const payload: LeadPayload = {
      name: nameVal,
      whatsapp: fullPhone,
      message: msgVal,
      source: "landing-orejas-en-armonia",
    };

    try {
      await sendLead(payload);
      openWhatsApp(nameVal, fullPhone, msgVal);
      toast("¡Gracias! Te contactaremos por WhatsApp.");
      form.reset();
      // restaurar país y prefijo
      loadCountries().then((list) => {
        populateCountrySelect(countrySel, list);
        if (countrySel.value) dialBadge.textContent = countrySel.value;
      });
    } catch (err) {
      console.error(err);
      openWhatsApp(nameVal, fullPhone, msgVal);
      toast("Enviamos a WhatsApp. Intentaremos guardar el lead luego.", false);
    } finally {
      btn.disabled = false;
      btn.textContent = original || "Enviar";
    }
  });
}

document.addEventListener("DOMContentLoaded", initLeadForm);
