// src/js/ba-carousel.js

document.addEventListener("components-loaded", () => {
  "use strict";

  const API = "http://127.0.0.1:8000";
  const viewport = document.getElementById("ba-viewport");
  const dotsWrap = document.getElementById("ba-dots");
  const prevBtn = document.querySelector(".ba-prev");
  const nextBtn = document.querySelector(".ba-next");

  if (!viewport || !dotsWrap || !prevBtn || !nextBtn) return;

  let idx = 0;
  const slides = [];
  const dots = [];
  let caseData = [];

  // ──────────────────────────────────────────────
  // Utils
  // ──────────────────────────────────────────────
  function normalizeSettings(raw) {
    if (!raw) return null;

    // Puede venir como string JSON o como objeto
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    if (typeof raw === "object") return raw;
    return null;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ──────────────────────────────────────────────
  // Cargar casos
  // ──────────────────────────────────────────────
  fetch(`${API}/api/cases`, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`GET /api/cases ${r.status}`);
      return r.json();
    })
    .then((cases) => {
      if (!Array.isArray(cases) || cases.length === 0) {
        viewport.innerHTML = `<div class="ba-empty">Aún no hay casos cargados.</div>`;
        return;
      }

      caseData = cases;
      console.log("Cases recibidos:", cases);
      cases.forEach((c, i) => addSlide(c, i));
      wireNav();
    })
    .catch((e) => {
      console.error("Error cargando casos:", e);
      viewport.innerHTML = `<div class="ba-empty">No pude cargar los casos. Revisa que el backend esté encendido.</div>`;
    });

  // ──────────────────────────────────────────────
  // Crear cada slide
  // ──────────────────────────────────────────────
  function addSlide(c, i) {
    const split = typeof c.split === "number" ? c.split : 50;

    const slide = document.createElement("div");
    slide.className = "ba-slide" + (i === 0 ? " is-active" : "");
    slide.innerHTML = `
      <div class="ba-wrap">
        <img class="ba-img ba-before" loading="lazy" src="${c.before}" alt="Antes ${c.label ?? ""}">
        <img class="ba-img ba-after"  loading="lazy" src="${c.after}"  alt="Después ${c.label ?? ""}">
        <div class="ba-handle" style="left:${split}%"></div>
        <input class="ba-range" type="range" min="0" max="100" value="${split}">
        ${c.label ? `<div class="ba-label">${escapeHtml(c.label)}</div>` : ""}
      </div>`;

    viewport.appendChild(slide);
    slides.push(slide);

    const dot = document.createElement("button");
    dot.className = "ba-dot" + (i === 0 ? " is-active" : "");
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
    dots.push(dot);

    const range  = slide.querySelector(".ba-range");
    const after  = slide.querySelector(".ba-after");
    const handle = slide.querySelector(".ba-handle");
    const before = slide.querySelector(".ba-before");
    const wrap   = slide.querySelector(".ba-wrap");

    if (!range || !after || !handle || !before || !wrap) return;

    // Errores de carga de imagen
    slide.querySelectorAll("img").forEach((img) => {
      img.addEventListener("error", () => {
        console.error("Imagen no carga:", img.src);
        wrap.style.background = "#f6d6d6";
      });
    });

    // Aplicar ajustes cuando haya layout
    let pendingInit = true;
    function safeInit() {
      if (!pendingInit) return;
      pendingInit = false;
      initSlideState(slide, c);
    }

    before.addEventListener("load", safeInit);
    after.addEventListener("load", safeInit);
    requestAnimationFrame(safeInit);

    // Slider de corte
    range.addEventListener("input", () => {
      const v = Number(range.value);
      after.style.clipPath = `inset(0 0 0 ${v}%)`;
      handle.style.left = `${v}%`;
    });

    slide.addEventListener("pointerdown", (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const v = Math.max(
        0,
        Math.min(100, ((e.clientX - r.left) / r.width) * 100)
      );
      range.value = String(v);
      after.style.clipPath = `inset(0 0 0 ${v}%)`;
      handle.style.left = `${v}%`;
    });
  }

  // ──────────────────────────────────────────────
  // Aplicar zoom / posición + split
  // ──────────────────────────────────────────────
  function initSlideState(slide, c) {
    const wrap   = slide.querySelector(".ba-wrap");
    const before = slide.querySelector(".ba-before");
    const after  = slide.querySelector(".ba-after");
    const range  = slide.querySelector(".ba-range");
    const handle = slide.querySelector(".ba-handle");
    if (!wrap || !before || !after || !range || !handle) return;

    const rect = wrap.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;

    function apply(img, cfgRaw) {
      const cfg = normalizeSettings(cfgRaw) || {};
      const rawX = Number(cfg.x ?? 0);
      const rawY = Number(cfg.y ?? 0);
      const zoom = Number(cfg.scale ?? 1);

      // Si los valores son pequeños en magnitud (|x|,|y| <= 2),
      // los interpretamos como proporciones de ancho/alto (normalizados).
      const x = Math.abs(rawX) <= 2 ? rawX * w : rawX;
      const y = Math.abs(rawY) <= 2 ? rawY * h : rawY;

      img.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
      img.style.transformOrigin = "center center";
    }

    apply(before, c.before_settings || c.beforeSettings);
    apply(after,  c.after_settings  || c.afterSettings);

    const split = typeof c.split === "number" ? c.split : 50;
    range.value = String(split);
    after.style.clipPath = `inset(0 0 0 ${split}%)`;
    handle.style.left = `${split}%`;
  }

  // ──────────────────────────────────────────────
  // Navegación
  // ──────────────────────────────────────────────
  function wireNav() {
    prevBtn.addEventListener("click", () => goTo(idx - 1));
    nextBtn.addEventListener("click", () => goTo(idx + 1));

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") goTo(idx - 1);
      if (e.key === "ArrowRight") goTo(idx + 1);
    });

    // Re-aplicar ajustes al redimensionar
    window.addEventListener("resize", () => {
      slides.forEach((slide, i) => {
        const c = caseData[i];
        if (c) initSlideState(slide, c);
      });
    });
  }

  function goTo(n) {
    slides[idx].classList.remove("is-active");
    dots[idx].classList.remove("is-active");
    idx = (n + slides.length) % slides.length;
    slides[idx].classList.add("is-active");
    dots[idx].classList.add("is-active");
  }
});
