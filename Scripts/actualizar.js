
const botonActualizar = document.getElementById('btn-actualizar');

botonActualizar.addEventListener('click', () => {
  document.querySelectorAll("iframe").forEach(frame => {
    const src = frame.src;
    frame.src = src; // Forzar recarga de cada iframe
  });
});

document.getElementById('btn-cerrar').addEventListener('click', () => {
  window.close(); // Intentar cerrar la ventana actual
}); 
function closeWindow() {
  localStorage.clear(); // Limpiar almacenamiento local
  window.location.href = "/login.html" ; // devuleve al login
}
  