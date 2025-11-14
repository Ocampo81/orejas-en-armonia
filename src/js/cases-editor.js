// src/js/cases-editor.js
(() => {
  const beforeInput = document.getElementById("before");
  const afterInput = document.getElementById("after");
  const editorSection = document.getElementById("cases-editor");

  if (!beforeInput || !afterInput || !editorSection) return;

  const viewport = document.getElementById("ba-editor-viewport");
  const imgBefore = document.getElementById("ba-editor-before");
  const imgAfter = document.getElementById("ba-editor-after");
  const divider = document.getElementById("ba-editor-divider");
  const slider = document.getElementById("ba-editor-slider");
  const sideButtons = editorSection.querySelectorAll("[data-side]");
  const zoomButtons = editorSection.querySelectorAll("[data-zoom]");
  const resetBtn = document.getElementById("ba-editor-reset");

  let urls = { before: null, after: null };

  const state = {
    active: "after",
    split: 50, // 0-100
    before: { x: 0, y: 0, scale: 1 },
    after: { x: 0, y: 0, scale: 1 },
  };

  function setSplit(pct) {
    state.split = Math.min(100, Math.max(0, pct));
    slider.value = String(state.split);

    const v = state.split;
    imgBefore.style.clipPath = `polygon(0 0, ${v}% 0, ${v}% 100%, 0 100%)`;
    imgAfter.style.clipPath = `polygon(${v}% 0, 100% 0, 100% 100%, ${v}% 100%)`;
    divider.style.left = `${v}%`;
  }

  function applyTransforms() {
    imgBefore.style.transform = `translate(${state.before.x}px, ${state.before.y}px) scale(${state.before.scale})`;
    imgAfter.style.transform = `translate(${state.after.x}px, ${state.after.y}px) scale(${state.after.scale})`;
  }

  function loadPreview(side, file) {
    if (!file) return;
    if (urls[side]) URL.revokeObjectURL(urls[side]);
    const url = URL.createObjectURL(file);
    urls[side] = url;
    if (side === "before") imgBefore.src = url;
    if (side === "after") imgAfter.src = url;

    // si ambas tienen algo, mostramos editor
    if (beforeInput.files[0] && afterInput.files[0]) {
      editorSection.style.display = "block";
    }
  }

  beforeInput.addEventListener("change", () => {
    loadPreview("before", beforeInput.files[0]);
  });

  afterInput.addEventListener("change", () => {
    loadPreview("after", afterInput.files[0]);
  });

  // slider
  slider.addEventListener("input", () => {
    setSplit(Number(slider.value || 50));
  });
  setSplit(50);
  applyTransforms();

  // cambiar lado activo
  sideButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const side = btn.getAttribute("data-side");
      if (!side) return;
      state.active = side;
      sideButtons.forEach((b) => b.classList.remove("ba-editor__btn--active"));
      btn.classList.add("ba-editor__btn--active");
    });
  });

  // zoom in/out
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

  // reset vista
  resetBtn.addEventListener("click", () => {
    state.before = { x: 0, y: 0, scale: 1 };
    state.after = { x: 0, y: 0, scale: 1 };
    setSplit(50);
    applyTransforms();
  });

  // drag para pan (mouse + touch)
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function startDrag(x, y) {
    dragging = true;
    lastX = x;
    lastY = y;
  }

  function moveDrag(x, y) {
    if (!dragging) return;
    const dx = x - lastX;
    const dy = y - lastY;
    lastX = x;
    lastY = y;

    const current = state[state.active];
    current.x += dx;
    current.y += dy;
    applyTransforms();
  }

  function endDrag() {
    dragging = false;
  }

  viewport.addEventListener("mousedown", (e) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  });
  window.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
  window.addEventListener("mouseup", endDrag);

  viewport.addEventListener("touchstart", (e) => {
    if (!e.touches[0]) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!e.touches[0]) return;
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  }, { passive: true });

  window.addEventListener("touchend", endDrag);
  window.addEventListener("touchcancel", endDrag);

  // arranque: ocultar editor hasta que haya 2 imágenes
  editorSection.style.display = "none";

  window.baEditorGetState = function () {
    return {
      split: state.split,
      before: { ...state.before },
      after: { ...state.after }
    };
  };
})();
