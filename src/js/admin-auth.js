// src/js/admin-auth.js

// Base de la API de admin en FastAPI
const ADMIN_API_BASE = "http://127.0.0.1:8000/api/admin";

/**
 * Llama al backend para hacer login de admin.
 * Recibe usuario y contraseña.
 * Si hay error lanza Error con mensaje descriptivo.
 */
async function adminLoginRequest(username, password) {
  const cleanUser = (username || "").trim();
  const cleanPass = password || "";

  if (!cleanUser || !cleanPass) {
    throw new Error("Completa usuario y contraseña.");
  }

  const res = await fetch(`${ADMIN_API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // muy importante para que se guarde la cookie
    body: JSON.stringify({ username: cleanUser, password: cleanPass }),
  });

  if (!res.ok) {
    // Intentamos leer un mensaje más específico del backend, pero sin rompernos
    let msg = "Usuario o contraseña incorrectos.";
    try {
      const data = await res.json();
      if (data && data.detail) {
        if (Array.isArray(data.detail) && data.detail[0]?.msg) {
          msg = data.detail[0].msg;
        } else if (typeof data.detail === "string") {
          msg = data.detail;
        }
      }
    } catch (_) {
      // ignoramos errores de parseo
    }
    throw new Error(msg);
  }

  // Si quieres, puedes usar lo que devuelva el backend
  // (ahora mismo solo nos interesa que no falle)
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/**
 * Verifica que haya sesión de admin.
 * Si no la hay, redirige a loginUrl.
 */
async function requireAdminOrRedirect(loginUrl) {
  try {
    const res = await fetch(`${ADMIN_API_BASE}/me`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("No autenticado");
    }

    // Podrías leer el usuario si lo necesitas:
    // const data = await res.json();
    // console.log("Admin:", data);
  } catch (err) {
    console.warn("Admin no autenticado, redirigiendo…", err);
    window.location.href = loginUrl;
  }
}

/**
 * Conecta el botón #admin-logout-btn para cerrar sesión
 * y luego redirigir a redirectUrl (normalmente el login).
 */
function setupAdminLogout(redirectUrl = "/src/admin/login.html") {
  const btn = document.getElementById("admin-logout-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      await fetch(`${ADMIN_API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Error al hacer logout (se puede ignorar):", err);
    } finally {
      window.location.href = redirectUrl;
    }
  });
}

// Exponemos todo en window para poder usarlo desde los HTML
window.adminLoginRequest = adminLoginRequest;
window.requireAdminOrRedirect = requireAdminOrRedirect;
window.setupAdminLogout = setupAdminLogout;
