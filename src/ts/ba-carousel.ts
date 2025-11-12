// src/ts/ba-carousel.ts
type BACase = { before: string; after: string; label?: string };

(() => {
  const API = "http://127.0.0.1:8000"; // ← forzamos puerto del backend
  const viewport = document.getElementById("ba-viewport")!;
  const dotsWrap = document.getElementById("ba-dots")!;
  const prevBtn = document.querySelector<HTMLButtonElement>(".ba-prev")!;
  const nextBtn = document.querySelector<HTMLButtonElement>(".ba-next")!;

  let idx = 0;
  const slides: HTMLElement[] = [];
  const dots: HTMLButtonElement[] = [];

  fetch(`${API}/api/cases`, { cache: "no-store" })
    .then(r => {
      if (!r.ok) throw new Error(`GET /api/cases ${r.status}`);
      return r.json();
    })
    .then((cases: BACase[]) => {
      if (!Array.isArray(cases) || cases.length === 0) {
        viewport.innerHTML = `<div class="ba-empty">Aún no hay casos cargados.</div>`;
        return;
      }
      console.log("Cases recibidos:", cases);
      cases.forEach((c, i) => addSlide(c, i));
      wireNav();
    })
    .catch((e) => {
      console.error("Error cargando casos:", e);
      viewport.innerHTML = `<div class="ba-empty">No pude cargar los casos. Revisa que el backend esté encendido.</div>`;
    });

  function addSlide(c: BACase, i: number) {
    const slide = document.createElement("div");
    slide.className = "ba-slide" + (i === 0 ? " is-active" : "");
    slide.innerHTML = `
      <div class="ba-wrap">
        <img class="ba-img ba-before" loading="lazy" src="${c.before}" alt="Antes ${c.label ?? ""}">
        <img class="ba-img ba-after"  loading="lazy" src="${c.after}"  alt="Después ${c.label ?? ""}">
        <div class="ba-handle" style="left:50%"></div>
        <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Control comparador">
        ${c.label ? `<div class="ba-label">${escapeHtml(c.label)}</div>` : ""}
      </div>`;

    // mostrar si alguna imagen falla
    slide.querySelectorAll<HTMLImageElement>("img").forEach(img => {
      img.addEventListener("error", () => {
        console.error("Imagen no carga:", img.src);
        (slide.querySelector(".ba-wrap") as HTMLElement).style.background = "#f6d6d6";
      });
    });

    viewport.appendChild(slide);
    slides.push(slide);

    const dot = document.createElement("button");
    dot.className = "ba-dot" + (i === 0 ? " is-active" : "");
    dot.type = "button";
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
    dots.push(dot);

    const range = slide.querySelector<HTMLInputElement>(".ba-range")!;
    const after = slide.querySelector<HTMLImageElement>(".ba-after")!;
    const handle = slide.querySelector<HTMLDivElement>(".ba-handle")!;
    range.addEventListener("input", () => {
      const v = Number(range.value);
      after.style.clipPath = `inset(0 0 0 ${v}%)`;
      handle.style.left = `${v}%`;
    });
    slide.addEventListener("pointerdown", (e) => {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const v = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      range.value = String(v);
      after.style.clipPath = `inset(0 0 0 ${v}%)`;
      handle.style.left = `${v}%`;
    });
  }

  function wireNav() {
    prevBtn.addEventListener("click", () => goTo(idx - 1));
    nextBtn.addEventListener("click", () => goTo(idx + 1));
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") goTo(idx - 1);
      if (e.key === "ArrowRight") goTo(idx + 1);
    });
  }
  function goTo(n: number) {
    slides[idx].classList.remove("is-active");
    dots[idx].classList.remove("is-active");
    idx = (n + slides.length) % slides.length;
    slides[idx].classList.add("is-active");
    dots[idx].classList.add("is-active");
  }
  function escapeHtml(s: string) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
