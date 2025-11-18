// src/js/cases-admin.js
const API_BASE = "http://127.0.0.1:8000/api/cases"; // FastAPI

const form = document.getElementById("case-form");
const msgEl = document.getElementById("case-msg");
const tbody = document.getElementById("cases-body");

function setMsg(text, ok = true) {
  if (!msgEl) return;
  msgEl.textContent = text || "";
  msgEl.style.color = ok ? "var(--brand)" : "#b91c1c";
}

function createRow(c) {
  const tr = document.createElement("tr");
  tr.dataset.id = c.id;

  const tdId = document.createElement("td");
  tdId.style.padding = "6px 8px";
  tdId.textContent = c.id;

  const tdLabel = document.createElement("td");
  tdLabel.style.padding = "6px 8px";
  tdLabel.textContent = c.label || `Paciente ${c.id}`;

  const tdBefore = document.createElement("td");
  tdBefore.style.padding = "6px 8px";
  const imgB = document.createElement("img");
  imgB.src = c.before;
  imgB.alt = "Antes";
  imgB.style.width = "60px";
  imgB.style.borderRadius = "6px";
  tdBefore.appendChild(imgB);

  const tdAfter = document.createElement("td");
  tdAfter.style.padding = "6px 8px";
  const imgA = document.createElement("img");
  imgA.src = c.after;
  imgA.alt = "Después";
  imgA.style.width = "60px";
  imgA.style.borderRadius = "6px";
  tdAfter.appendChild(imgA);

  const tdActions = document.createElement("td");
  tdActions.style.padding = "6px 8px";
  const btnDel = document.createElement("button");
  btnDel.textContent = "Eliminar";
  btnDel.className = "btn btn--ghost";
  btnDel.style.padding = "4px 10px";
  btnDel.style.fontSize = ".85rem";
  btnDel.addEventListener("click", async () => {
    if (!confirm(`¿Eliminar caso #${c.id}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/${c.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error("Error eliminando");
      tr.remove();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el caso");
    }
  });
  tdActions.appendChild(btnDel);

  tr.append(tdId, tdLabel, tdBefore, tdAfter, tdActions);
  return tr;
}

async function loadCases() {
  tbody.innerHTML = "";
  try {
    const res = await fetch(API_BASE, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Error al cargar casos");
    const data = await res.json();
    data.forEach((c) => tbody.appendChild(createRow(c)));
  } catch (err) {
    console.error(err);
    setMsg("No se pudieron cargar los casos", false);
  }
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("Subiendo caso…", true);

    const fd = new FormData(form);

    const before = fd.get("before");
    const after = fd.get("after");

    if (!before || !after) {
      setMsg("Debes seleccionar ambas fotos.", false);
      return;
    }

    // Ajustes del editor visual
    if (typeof window.baEditorGetState === "function") {
      try {
        const editorState = window.baEditorGetState() || {};
        const split = editorState.split ?? 50;
        const beforeSettings = editorState.before || {};
        const afterSettings = editorState.after || {};

        fd.append("split", String(split));
        fd.append("before_settings", JSON.stringify(beforeSettings));
        fd.append("after_settings", JSON.stringify(afterSettings));
      } catch (err) {
        console.warn("No se pudo leer el estado del editor:", err);
      }
    }

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error al subir caso");
      }
      const created = await res.json();
      tbody.appendChild(createRow(created));
      form.reset();
      setMsg("Caso subido correctamente ✅", true);
    } catch (err) {
      console.error(err);
      setMsg("Error al subir el caso", false);
    }
  });
}

loadCases();
