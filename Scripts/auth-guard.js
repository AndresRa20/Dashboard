/**
 * auth-guard.js
 * Pequeño script que protege páginas del dashboard en el frontend.
 * - Si no hay token JWT en localStorage redirige a `/login.html`.
 * - Si hay token, llama a `/api/me` para validar que el token sigue siendo válido.
 * - En caso de token inválido borra localStorage y redirige al login.
 */
(function() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Si no hay token -> login
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Si no es admin -> dashboard normal
    if (window.location.pathname.includes("admin") && role !== "admin") {
        alert("No tienes permisos de administrador.");
        window.location.href = "/dashboard.html";
        return;
    }

    // Validar token en el backend
    fetch('/api/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) {
            localStorage.clear();
            window.location.href = '/login.html';
        }
    })
    .catch(() => {});
})();

