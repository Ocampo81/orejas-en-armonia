// src/js/load-components.js

document.addEventListener("DOMContentLoaded", async () => {
  const includes = document.querySelectorAll("[data-include]");
  const tasks = [];

  includes.forEach((placeholder) => {
    const file = placeholder.getAttribute("data-include");
    if (!file) return;

    const task = fetch(file)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`Error al cargar ${file}: ${resp.status}`);
        }
        return resp.text();
      })
      .then((html) => {
        // Creamos un template para que el HTML se inserte correctamente
        const tpl = document.createElement("template");
        tpl.innerHTML = html.trim();

        // Reemplazamos COMPLETAMENTE el <div data-include=""> por el componente
        placeholder.replaceWith(tpl.content);
      })
      .catch((err) => {
        console.error("Error al cargar componente:", file, err);
      });

    tasks.push(task);
  });

  // Esperamos a que todos los componentes estén cargados
  await Promise.all(tasks);

  // Evento nuevo que tus otros scripts pueden escuchar
  document.dispatchEvent(new Event("components-loaded"));
});
