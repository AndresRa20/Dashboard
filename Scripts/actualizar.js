
const botonActualizar = document.getElementById('btn-actualizar');

botonActualizar.addEventListener('click', () => {
  document.querySelectorAll("iframe").forEach(frame => {
    const src = frame.src;
    frame.src = src; // Forzar recarga de cada iframe
  });
});
