document.addEventListener("DOMContentLoaded", () => {

    // 🔹 Activar botones
    document.getElementById("logout").addEventListener("click", logout);
    document.getElementById("dashboard").addEventListener("click", dashboard);

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Permitir entrar SOLO a admin
    if (!token || role !== "admin") {
        alert("Acceso denegado.");
        window.location.href = "/login.html";
        return;
    }

    // Detectar entorno (local o Railway)
    const API_URL = window.location.origin.includes("5500")
        ? "http://127.0.0.1:3000"
        : "";

    cargarUsuarios();


    //   CARGAR USUARIOS
 
    async function cargarUsuarios() {
        try {
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();
            const tbody = document.getElementById("users-body");
            tbody.innerHTML = "";

            data.users.forEach(user => {
                const nextRole =
                    user.role === "user" ? "viewer" :
                    user.role === "viewer" ? "admin" :
                    "user";

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.lastname}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="btn btn-role btn-sm" onclick="cambiarRol(${user.id}, '${user.role}')">
                            Cambiar a ${nextRole}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${user.id})">
                            Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

        } catch (err) {
            console.error(err);
            alert("Error cargando usuarios.");
        }
    }

   
    //   CAMBIAR ROL

    window.cambiarRol = async function (id, currentRole) {
        const rolActual = currentRole.toLowerCase();

        let nuevoRol = "user";
        if (rolActual === "user") nuevoRol = "viewer";
        else if (rolActual === "viewer") nuevoRol = "admin";
        else if (rolActual === "admin") nuevoRol = "user";

        if (!confirm(`¿Cambiar rol de "${rolActual}" a "${nuevoRol}"?`)) return;

        try {
            await fetch(`${API_URL}/api/admin/change-role`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ id, role: nuevoRol })
            });

            cargarUsuarios();

        } catch (err) {
            console.error(err);
            alert("Error cambiando rol.");
        }
    };


    //   ELIMINAR USUARIO
 
    window.eliminarUsuario = async function (id) {
        if (!confirm("¿Deseas eliminar este usuario?")) return;

        try {
            await fetch(`${API_URL}/api/admin/delete-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ id })
            });

            cargarUsuarios();

        } catch (err) {
            console.error(err);
            alert("Error eliminando usuario.");
        }
    };

});



//   CERRAR SESIÓN

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login.html";
}


//   VER DASHBOARD

function dashboard() {
    window.location.href = "/Inicio.html";
}
