// src/js/leads-admin.js
(() => {
  const API = "http://127.0.0.1:8000/api/leads";

  // UI
  const tbody = document.getElementById("leads-tbody");
  const q = document.getElementById("q");
  const source = document.getElementById("source");
  const from = document.getElementById("from");
  const to = document.getElementById("to");
  const size = document.getElementById("size");
  const btnRefresh = document.getElementById("btn-refresh");
  const btnExport = document.getElementById("btn-export");
  const btnPrev = document.getElementById("prev");
  const btnNext = document.getElementById("next");
  const pagerInfo = document.getElementById("pager-info");
  const pageLabel = document.getElementById("page-label");

  // Estado
  const state = {
    q: "",
    source: "",
    from: "",
    to: "",
    page: 1,
    size: 20,
    total: 0,
    pages: 1,
    items: [],
  };

  // Utils
  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      return `${y}-${m}-${day} ${hh}:${mm} UTC`;
    } catch {
      return iso || "";
    }
  };

  const waLink = (
    whatsapp,
    presetMsg = "Hola, vi tu servicio de orejas en armonía."
  ) => {
    const clean = String(whatsapp).replace(/\s+/g, "");
    const num = clean.startsWith("+") ? clean.slice(1) : clean;
    return `https://wa.me/${num}?text=${encodeURIComponent(presetMsg)}`;
  };

  const copy = (t) =>
    navigator.clipboard.writeText(t).catch(() => {
      /* ignore */
    });

  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const escAttr = (s) => esc(s).replaceAll("'", "&#39;");

  const debounce = (fn, ms = 300) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  function renderRows(list) {
    if (!list.length) {
      tbody.innerHTML =
        `<tr><td colspan="6" class="empty">Sin datos</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((l) => {
        const date = fmtDate(l.created_at || "");
        const walink = waLink(l.whatsapp || "");
        return `
        <tr>
          <td class="mono nowrap">${date}</td>
          <td>${esc(l.name || "")}</td>
          <td class="mono nowrap">${esc(l.whatsapp || "")}</td>
          <td>${esc((l.message || "").trim())}</td>
          <td><span class="pill">${esc(
            (l.source || "landing-orejas-en-armonia").trim()
          )}</span></td>
          <td class="actions-row">
            <a class="btn-x" href="${walink}" target="_blank" rel="noopener">WhatsApp</a>
            <button class="btn-x" data-copy="${escAttr(
              l.whatsapp || ""
            )}">Copiar</button>
          </td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        copy(btn.getAttribute("data-copy") || "");
        btn.textContent = "¡Copiado!";
        setTimeout(() => (btn.textContent = "Copiar"), 900);
      });
    });
  }

  function renderPager() {
    const start = state.total === 0 ? 0 : (state.page - 1) * state.size + 1;
    const end = Math.min(state.page * state.size, state.total);
    pagerInfo.textContent = `Mostrando ${start}–${end} de ${state.total}`;
    pageLabel.textContent = `página ${state.page}/${state.pages}`;
    btnPrev.disabled = state.page <= 1;
    btnNext.disabled = state.page >= state.pages || state.pages === 0;
  }

  function buildURL() {
    const sp = new URLSearchParams();
    if (state.q) sp.set("q", state.q);
    if (state.source) sp.set("source", state.source);
    if (state.from) sp.set("date_from", state.from);
    if (state.to) sp.set("date_to", state.to);
    sp.set("page", String(state.page));
    sp.set("page_size", String(state.size));
    return `${API}?${sp.toString()}`;
  }

  async function load() {
    tbody.innerHTML =
      `<tr><td colspan="6" class="empty">Cargando…</td></tr>`;

    try {
      const res = await fetch(buildURL(), {
        headers: { Accept: "application/json" },
        credentials: "include",          // 👈 MÁGIA: manda la cookie de admin
      });

      if (res.status === 401) {
        tbody.innerHTML =
          `<tr><td colspan="6" class="empty">Sesión expirada. Vuelve a iniciar sesión.</td></tr>`;
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      state.items = data.items || [];
      state.total = data.total || 0;
      state.pages = data.pages || 1;
      renderRows(state.items);
      renderPager();
    } catch (e) {
      console.error(e);
      tbody.innerHTML =
        `<tr><td colspan="6" class="empty">Error al cargar</td></tr>`;
    }
  }

  // Eventos
  const apply = () => {
    state.q = q.value.trim();
    state.source = source.value.trim();
    state.from = from.value;
    state.to = to.value;
    state.size = parseInt(size.value, 10) || 20;
    state.page = 1;
    load();
  };

  q.addEventListener("input", debounce(apply, 400));
  source.addEventListener("change", apply);
  from.addEventListener("change", apply);
  to.addEventListener("change", apply);
  size.addEventListener("change", apply);
  btnRefresh.addEventListener("click", apply);

  btnPrev.addEventListener("click", () => {
    if (state.page > 1) {
      state.page--;
      load();
    }
  });

  btnNext.addEventListener("click", () => {
    if (state.page < state.pages) {
      state.page++;
      load();
    }
  });

  btnExport.addEventListener("click", () => {
    const header = ["created_at", "name", "whatsapp", "message", "source", "id"];
    const lines = [header.join(",")];

    for (const l of state.items) {
      const row = [
        (l.created_at || "").replace(/,/g, " "),
        l.name || "",
        l.whatsapp || "",
        (l.message || "").replace(/\r?\n/g, " ").replace(/,/g, " "),
        l.source || "landing-orejas-en-armonia",
        l.id ?? "",
      ].map((v) => `"${String(v).replaceAll('"', '""')}"`);
      lines.push(row.join(","));
    }

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `leads-${ts}-p${state.page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // Carga inicial
  load();
})();
