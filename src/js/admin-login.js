// src/js/admin-login.js

// Usamos la misma API si ADMIN_API_BASE existe; si no, hacemos fallback.
const LOGIN_API_URL =
  typeof ADMIN_API_BASE !== "undefined"
    ? `${ADMIN_API_BASE}/login`
    : "http://127.0.0.1:8000/api/admin/login";

/**
 * Función que se llama desde el form del login:
 * onsubmit="return adminLoginRequest(event)"
 */
async function adminLoginRequest(event) {
  if (event) event.preventDefault();

  const usernameInput = document.getElementById("admin-username");
  const passwordInput = document.getElementById("admin-password");
  const errorEl = document.getElementById("admin-login-error");

  const username = (usernameInput?.value || "").trim();
  const password = passwordInput?.value || "";

  if (errorEl) errorEl.textContent = "";

  if (!username || !password) {
    if (errorEl) errorEl.textContent = "Completa usuario y contraseña.";
    return false;
  }

  try {
    const res = await fetch(LOGIN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      // Para no dar pistas: mismo error siempre
      if (errorEl) errorEl.textContent = "Usuario o contraseña incorrectos.";
      return false;
    }

    // Login OK → nos vamos al panel de Casos
    window.location.href = "/src/admin/cases.html";
    return false;
  } catch (err) {
    console.error("Error en login admin:", err);
    if (errorEl) errorEl.textContent = "Error al intentar iniciar sesión.";
    return false;
  }
}

// La exponemos en window porque el HTML la llama por nombre
window.adminLoginRequest = adminLoginRequest;
