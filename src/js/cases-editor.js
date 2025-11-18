// src/js/cases-editor.js
(() => {
  const beforeInput = document.getElementById("before");
  const afterInput = document.getElementById("after");
  const editorSection = document.getElementById("cases-editor");

  if (!beforeInput || !afterInput || !editorSection) return;

  // Viewports de edición individual
  const vpBefore = document.getElementById("ba-editor-before-viewport");
  const vpAfter = document.getElementById("ba-editor-after-viewport");

  // Imágenes de edición
  const imgBefore = document.getElementById("ba-editor-before");
  const imgAfter = document.getElementById("ba-editor-after");

  // Vista comparativa final
  const finalBefore = document.getElementById("ba-final-before");
  const finalAfter = document.getElementById("ba-final-after");
  const finalSlider = document.getElementById("ba-final-slider");
  const finalHandle = document.getElementById("ba-final-handle");
  const finalWrap = document.querySelector(".ba-final__wrap");

  // Controles
  const sideButtons = editorSection.querySelectorAll("[data-side-btn]");
  const zoomButtons = editorSection.querySelectorAll("[data-zoom]");
  const resetBtn = document.getElementById("ba-editor-reset");

  if (
    !vpBefore || !vpAfter || !imgBefore || !imgAfter ||
    !finalBefore || !finalAfter || !finalSlider || !finalHandle || !finalWrap
  ) {
    return;
  }

  const urls = { before: null, after: null };

  const state = {
    /** @type {"before" | "after"} */
    active: "before",
    before: { x: 0, y: 0, scale: 1 },
    after:  { x: 0, y: 0, scale: 1 },
    split: 50, // 0–100
  };

  // ── helpers de estado ────────────────────────────────
  function setActive(side) {
    if (side !== "before" && side !== "after") return;
    state.active = side;
    sideButtons.forEach((b) => b.classList.remove("ba-editor__btn--active"));
    sideButtons.forEach((b) => {
      if (b.getAttribute("data-side-btn") === side) {
        b.classList.add("ba-editor__btn--active");
      }
    });
  }

  function applyTransforms() {
    /** @type {const} */
    const sides = ["before", "after"];
    sides.forEach((side) => {
      const s = state[side];
      const imgs = editorSection.querySelectorAll(
        `[data-ba-side="${side}"]`
      );
      imgs.forEach((img) => {
        img.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
      });
    });
  }

  function setSplit(pct) {
    const v = Math.min(100, Math.max(0, pct));
    state.split = v;
    finalSlider.value = String(v);
    finalAfter.style.clipPath = `inset(0 0 0 ${v}%)`;
    finalHandle.style.left = `${v}%`;
  }

  function loadPreview(side, file) {
    if (!file) return;
    if (urls[side]) URL.revokeObjectURL(urls[side]);

    const url = URL.createObjectURL(file);
    urls[side] = url;

    if (side === "before") {
      imgBefore.src = url;
      finalBefore.src = url;
    }
    if (side === "after") {
      imgAfter.src = url;
      finalAfter.src = url;
    }

    if (beforeInput.files[0] && afterInput.files[0]) {
      editorSection.style.display = "block";
    }
  }

  // ── inputs de archivo ────────────────────────────────
  beforeInput.addEventListener("change", () => {
    loadPreview("before", beforeInput.files[0]);
  });

  afterInput.addEventListener("change", () => {
    loadPreview("after", afterInput.files[0]);
  });

  // ── cambiar lado activo ──────────────────────────────
  sideButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const side = btn.getAttribute("data-side-btn");
      if (!side) return;
      setActive(side);
    });
  });

  // ── zoom in/out ──────────────────────────────────────
  zoomButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.getAttribute("data-zoom");
      const current = state[state.active];
      const factor = dir === "in" ? 1.1 : 1 / 1.1;
      let next = current.scale * factor;
      next = Math.min(3.5, Math.max(0.7, next));
      current.scale = next;
      applyTransforms();
    });
  });

  // ── reset ────────────────────────────────────────────
  resetBtn.addEventListener("click", () => {
    state.before = { x: 0, y: 0, scale: 1 };
    state.after  = { x: 0, y: 0, scale: 1 };
    setSplit(50);
    applyTransforms();
  });

  // ── drag para mover (pan) ────────────────────────────
  let dragging = false;
  /** @type {"before" | "after" | null} */
  let dragSide = null;
  let lastX = 0;
  let lastY = 0;

  function startDrag(side, x, y) {
    if (side !== "before" && side !== "after") return;
    dragging = true;
    dragSide = side;
    lastX = x;
    lastY = y;
    setActive(side);
  }

  function moveDrag(x, y) {
    if (!dragging || !dragSide) return;
    const dx = x - lastX;
    const dy = y - lastY;
    lastX = x;
    lastY = y;
    const current = state[dragSide];
    current.x += dx;
    current.y += dy;
    applyTransforms();
  }

  function endDrag() {
    dragging = false;
    dragSide = null;
  }

  function bindDragEvents(viewport, side) {
    viewport.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startDrag(side, e.clientX, e.clientY);
    });
    viewport.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches[0]) return;
        const t = e.touches[0];
        startDrag(side, t.clientX, t.clientY);
      },
      { passive: true }
    );
  }

  bindDragEvents(vpBefore, "before");
  bindDragEvents(vpAfter, "after");

  window.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
  window.addEventListener("mouseup", endDrag);

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches[0]) return;
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    },
    { passive: true }
  );
  window.addEventListener("touchend", endDrag);
  window.addEventListener("touchcancel", endDrag);

  // ── slider comparativa final ─────────────────────────
  finalSlider.addEventListener("input", () => {
    setSplit(Number(finalSlider.value || 50));
  });

  finalWrap.addEventListener("pointerdown", (e) => {
    const rect = finalWrap.getBoundingClientRect();
    const v = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    );
    setSplit(v);
  });

  // arranque
  setActive("before");
  setSplit(50);
  applyTransforms();
  editorSection.style.display = "none";

  // ── ESTADO PARA BACKEND (NORMALIZADO SOBRE LA VISTA FINAL) ─────
  // Guardamos x,y como proporción del ancho/alto de la vista comparativa.
  window.baEditorGetState = function () {
    const rect = finalWrap.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;

    function norm(side) {
      const s = state[side];
      return {
        x: s.x / w,
        y: s.y / h,
        scale: s.scale,
      };
    }

    return {
      split: state.split,
      before: norm("before"),
      after:  norm("after"),
    };
  };
})();
