// src/js/load-components.js

async function loadComponents() {
  const includes = document.querySelectorAll("[data-include]");
  const tasks = [];

  includes.forEach((el) => {
    const file = el.getAttribute("data-include");
    if (!file) return;

    const task = fetch(file)
      .then((resp) => resp.text())
      .then((html) => {
        el.innerHTML = html;
      })
      .catch((err) => {
        console.error("Error al cargar componente:", file, err);
      });

    tasks.push(task);
  });

  // Esperamos que TODAS las importaciones terminen
  await Promise.all(tasks);

  // 🔥 Nuevo evento que reemplaza DOMContentLoaded en los otros scripts
  document.dispatchEvent(new Event("components-loaded"));
}

document.addEventListener("DOMContentLoaded", loadComponents);
