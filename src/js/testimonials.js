// src/js/testimonials.js
document.addEventListener("components-loaded", () => {
  "use strict";

  const API = "http://127.0.0.1:8000";   // mismo que ba-carousel
  const list = document.getElementById("testimonials-list");
  if (!list) return;

  fetch(`${API}/api/testimonials`, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`GET /api/testimonials ${r.status}`);
      return r.json();
    })
    .then((items) => {
      if (!Array.isArray(items) || items.length === 0) {
        list.innerHTML = `<p class="muted">Aún no hay testimonios cargados.</p>`;
        return;
      }
      list.innerHTML = "";
      items.forEach(addCard);
    })
    .catch((err) => {
      console.error("Error cargando testimonios:", err);
      list.innerHTML = `<p class="muted">No se pudieron cargar los testimonios.</p>`;
    });

  function addCard(t) {
    const card = document.createElement("article");
    card.className = "testimonial-card";

    const header = document.createElement("div");
    header.className = "testimonial-header";

    if (t.photo) {
      const img = document.createElement("img");
      img.className = "testimonial-photo";
      img.src = t.photo;
      img.alt = `Foto de ${t.name || "paciente"}`;
      header.appendChild(img);
    }

    const info = document.createElement("div");
    const name = document.createElement("div");
    name.className = "testimonial-name";
    name.textContent = t.name || "Paciente";

    const role = document.createElement("div");
    role.className = "testimonial-role";
    role.textContent = t.role || "";

    info.appendChild(name);
    if (t.role) info.appendChild(role);

    header.appendChild(info);

    const text = document.createElement("p");
    text.className = "testimonial-text";
    text.textContent = t.text || "";

    card.appendChild(header);
    card.appendChild(text);
    list.appendChild(card);
  }
});
