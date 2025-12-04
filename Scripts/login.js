/**
 * login.js corregido y optimizado para LOCAL + RAILWAY
 * Detecta automáticamente si está en Live Server (5500) o en producción.
 * Usa rutas relativas en Railway para que el backend responda sin errores.
 */

document.addEventListener("DOMContentLoaded", () => {

    console.log("login.js cargado correctamente");

    // Debug visible (opcional)
    if (!document.getElementById("login-debug")) {
        const dbg = document.createElement("div");
        dbg.id = "login-debug";
        dbg.style.position = "fixed";
        dbg.style.right = "12px";
        dbg.style.bottom = "12px";
        dbg.style.background = "rgba(0,0,0,0.7)";
        dbg.style.color = "#fff";
        dbg.style.padding = "8px 12px";
        dbg.style.borderRadius = "6px";
        dbg.style.fontSize = "13px";
        dbg.style.zIndex = "9999";
        dbg.textContent = "debug: login.js activo";
        document.body.appendChild(dbg);
    }

    // Detectar entorno
    // Live Server = puerto 5500 → usa API local
    // Railway → API relativa "/api"
    const API_URL = window.location.origin.includes("5500")
        ? "http://127.0.0.1:3000"
        : "";

    // ANIMACIÓN DE FLIP
    const flipContainer = document.querySelector(".flip-container");
    const showRegisterButton = document.getElementById("show-register");
    const showLoginButton = document.getElementById("show-login");

    if (flipContainer && showRegisterButton && showLoginButton) {
        showRegisterButton.addEventListener("click", (event) => {
            event.preventDefault();
            flipContainer.classList.add("flipped");
        });

        showLoginButton.addEventListener("click", (event) => {
            event.preventDefault();
            flipContainer.classList.remove("flipped");
        });
    }

    // FORMULARIO DE REGISTRO
    const registrationForm = document.getElementById("registration-form");

    if (registrationForm) {
        registrationForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!validateRegistrationForm(this)) return;

            const data = {
                name: this.querySelector('[name="name"]').value,
                lastname: this.querySelector('[name="lastname"]').value,
                email: this.querySelector('[name="email"]').value,
                password: this.querySelector('[name="password"]').value
            };

            try {
                const res = await fetch(`${API_URL}/api/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const json = await res.json();
                document.getElementById("login-debug").textContent =
                    "register: status " + res.status;

                if (json.error) {
                    alert("Error: " + json.error);
                } else {
                    alert("Usuario registrado correctamente.");
                    flipContainer.classList.remove("flipped");
                }

            } catch (err) {
                console.error("Error fetch /api/register", err);
                document.getElementById("login-debug").textContent =
                    "register: error " + err.message;
                alert("Error al conectar con el servidor.");
            }
        });
    }

    // FORMULARIO DE LOGIN
const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const data = {
            email: this.querySelector('[name="email"]').value,
            password: this.querySelector('[name="password"]').value
        };

        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const json = await res.json();
            document.getElementById("login-debug").textContent =
                "login: status " + res.status;

            if (json.error) {
                alert("Error: " + json.error);
                return;
            }

            // Guardar token y rol
            localStorage.setItem("token", json.token);
            localStorage.setItem("role", json.role);

            // Detectar entorno correctamente
            const origin = window.location.origin;

            // REDIRECCIÓN PARA ADMIN
            if (json.role === "admin") {
                if (origin.includes("5500")) {
                    window.location.href = "http://127.0.0.1:3000/admin.html";
                } else {
                    window.location.href = "/admin.html";
                }
                return;
            }

            // REDIRECCIÓN PARA USUARIO NORMAL
            if (origin.includes("5500")) {
                window.location.href = "http://127.0.0.1:3000/Inicio.html";
            } else {
                window.location.href = "/Inicio.html";
            }

        } catch (err) {
            console.error("Error fetch /api/login", err);
            document.getElementById("login-debug").textContent =
                "login: error " + err.message;
            alert("Error al conectar con el servidor.");
        }
    });
}
});


// VALIDACIÓN DE REGISTRO
function validateRegistrationForm(form) {
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value.trim();

    if (!name || !email || !password) {
        alert("Todos los campos son obligatorios.");
        return false;
    }

    if (!email.includes("@") || !email.includes(".")) {
        alert("Correo inválido.");
        return false;
    }

    return true;
}
