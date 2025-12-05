/**
 * auth-guard.js
 * Protege páginas según el rol del usuario.
 */

(function () {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");

    // Sin token → login
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    const ruta = window.location.pathname;

    // 1) Proteger admin.html
    if (ruta.includes("admin") && role !== "admin") {
        alert("No tienes permisos de administrador.");
        window.location.href = "/Inicio.html";
        return;
    }

    // 2) Proteger dashboard completo si NO es admin
    if (ruta.includes("Inicio") && role !== "admin" && role !== "viewer") {
        alert("Acceso restringido: solo administradores.");
        window.location.href = "/login.html";
        return;
    }

    // Validar token en backend
    fetch("/api/me", {
        headers: {
            Authorization: "Bearer " + token
        }
    }).then(res => {
        if (!res.ok) {
            localStorage.clear();
            window.location.href = "/login.html";
        }
    }).catch(() => {});
})();
