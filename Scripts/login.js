/**
 * login.js
 * Frontend: maneja interacción en la página de login/registro.
 * - Controla la animación de "flip" entre login y registro
 * - Intercepta los `submit` de los formularios y hace `fetch` a la API
 * - Muestra mensajes de depuración y guarda el JWT en localStorage
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('login.js cargado');
    // crear contenedor de mensajes si no existe (para debug visible)
    if (!document.getElementById('login-debug')) {
        const dbg = document.createElement('div');
        dbg.id = 'login-debug';
        dbg.style.position = 'fixed';
        dbg.style.right = '12px';
        dbg.style.bottom = '12px';
        dbg.style.background = 'rgba(0,0,0,0.7)';
        dbg.style.color = '#fff';
        dbg.style.padding = '8px 12px';
        dbg.style.borderRadius = '6px';
        dbg.style.fontSize = '13px';
        dbg.style.zIndex = '9999';
        dbg.textContent = 'debug: login.js activo';
        document.body.appendChild(dbg);
    }

    // ANIMACIÓN
    const flipContainer = document.querySelector('.flip-container');
    const showRegisterButton = document.getElementById('show-register');
    const showLoginButton = document.getElementById('show-login');

    const registrationForm = document.getElementById('registration-form');
    const loginForm = document.getElementById('login-form');

    if (flipContainer && showRegisterButton && showLoginButton) {
        showRegisterButton.addEventListener('click', (event) => {
            event.preventDefault();
            flipContainer.classList.add('flipped');
        });

        showLoginButton.addEventListener('click', (event) => {
            event.preventDefault();
            flipContainer.classList.remove('flipped');
        });
    }

    // REGISTRO
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 

            if (validateRegistrationForm(this)) {

                const data = {
                    name: this.querySelector('[name="name"]').value,
                    lastname: this.querySelector('[name="lastname"]').value,
                    email: this.querySelector('[name="email"]').value,
                    password: this.querySelector('[name="password"]').value
                };

                try {
                    const res = await fetch("http://127.0.0.1:3000/api/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data)
                    });

                    const json = await res.json();

                    document.getElementById('login-debug').textContent = 'register: status ' + res.status;

                    if (json.error) {
                        alert("Error: " + json.error);
                    } else {
                        alert("Usuario registrado correctamente.");
                        flipContainer.classList.remove("flipped");
                    }
                } catch (err) {
                    console.error('Error fetch /api/register', err);
                    document.getElementById('login-debug').textContent = 'register: error ' + (err.message || err);
                    alert('Error de conexión al registrar. Revisa la consola.');
                }
            }
        });
    }

    // LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            if (validateLoginForm(this)) {

                const data = {
                    email: this.querySelector('[name="email"]').value,
                    password: this.querySelector('[name="password"]').value
                };

                try {
                    const res = await fetch("http://127.0.0.1:3000/api/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data)
                    });

                    const json = await res.json();
                    document.getElementById('login-debug').textContent = 'login: status ' + res.status;

                    if (json.error) {
                        alert("Error: " + json.error);
                    } else {
                        // Guardar JWT en localStorage
                        localStorage.setItem('token', json.token);
                        // Redirigir al dashboard
                        // Si la página está abierta desde Live Server (puerto 5500),
                        // redirigimos explícitamente al servidor Express en el puerto 3000.
                        const origin = window.location.origin || '';
                        if (origin.includes(':5500')) {
                            window.location.href = 'http://127.0.0.1:3000/Inicio.html';
                        } else {
                            window.location.href = '/Inicio.html';
                        }
                    }
                } catch (err) {
                    console.error('Error fetch /api/login', err);
                    document.getElementById('login-debug').textContent = 'login: error ' + (err.message || err);
                    alert('Error de conexión al iniciar sesión. Revisa la consola.');
                }
            }
        });
    }

}); // DOM READY


// VALIDACIÓN
function validateRegistrationForm(form) {
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value.trim();

    if (name === "" || email === "" || password === "") {
        alert("Todos los campos son obligatorios.");
        return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
        alert("Correo inválido.");
        return false;
    }

    return true;
}

function validateLoginForm(form) {
    return true;
}
