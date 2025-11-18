// src/js/testimonials-admin.js
const API = "http://127.0.0.1:8000/api/testimonials";

const form = document.getElementById("testimonial-form");
const msg = document.getElementById("testimonial-msg");
const tbody = document.getElementById("testimonials-body");

function setMsg(t, ok = true) {
  if (!msg) return;
  msg.textContent = t || "";
  msg.style.color = ok ? "var(--brand)" : "#b91c1c";
}

function createRow(t) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${t.id}</td>
    <td>${t.name}</td>
    <td>${t.photo
      ? `<img src="${t.photo}" style="width:60px;border-radius:6px;">`
      : "—"}</td>
    <td style="max-width:300px;">${t.text}</td>
    <td><button class="btn btn--ghost" data-del="${t.id}">Eliminar</button></td>
  `;

  const delBtn = tr.querySelector("[data-del]");
  delBtn.addEventListener("click", async () => {
    if (!confirm("¿Eliminar testimonio?")) return;

    try {
      const res = await fetch(`${API}/${t.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw 0;
      tr.remove();
    } catch {
      alert("Error al eliminar el testimonio");
    }
  });

  return tr;
}

async function load() {
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const res = await fetch(API, { credentials: "include" });
    if (!res.ok) throw 0;
    const data = await res.json();
    data.forEach((t) => tbody.appendChild(createRow(t)));
  } catch {
    setMsg("Error al cargar los testimonios", false);
  }
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    setMsg("Guardando…");

    try {
      const res = await fetch(API, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        setMsg("Error al guardar", false);
        return;
      }

      const nuevo = await res.json();
      tbody.appendChild(createRow(nuevo));
      form.reset();
      setMsg("Guardado correctamente");
    } catch {
      setMsg("Error al guardar", false);
    }
  });
}

load();
