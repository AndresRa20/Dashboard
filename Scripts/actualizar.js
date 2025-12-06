
const botonActualizar = document.getElementById('btn-actualizar');

botonActualizar.addEventListener('click', () => {
  document.querySelectorAll("iframe").forEach(frame => {
    const src = frame.src;
    frame.src = src; // Forzar recarga de cada iframe
  });
});

document.getElementById('btn-cerrar').addEventListener('click', () => {
  localStorage.removeItem("token"); // Limpiar almacenamiento local
  window.location.href = "/login.html"; // Redirigir al login
});
