/**
 * auth-guard.js
 * Pequeño script que protege páginas del dashboard en el frontend.
 * - Si no hay token JWT en localStorage redirige a `/login.html`.
 * - Si hay token, llama a `/api/me` para validar que el token sigue siendo válido.
 * - En caso de token inválido borra localStorage y redirige al login.
 */

(function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // No hay token, redirigir al login
        window.location.href = '/login.html';
    } else {
        // Verificar que el token sea válido contra el servidor (opcional)
        fetch('/api/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if (!res.ok) {
                // Token inválido -> limpiar y redirigir
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        })
        .catch(() => {
            // Error de conexión: dejamos cargar la página (comportamiento opcional)
        });
    }
})();
