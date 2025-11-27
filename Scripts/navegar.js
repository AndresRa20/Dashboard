const menuItems = document.querySelectorAll('.sidebar-list li');
const tituloVentana = document.getElementById('titulo-ventana');
const graf1 = document.querySelector('.iframe-grafica');

// Navegación por menú
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const area = item.getAttribute('data-area');
        tituloVentana.textContent = area;

        // Cambiar iframe según área
        const urls = {
            "Dashboard": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/p_z6mg0r1dxd?rm=minimal",
            "Calificaciones": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/LXQcF?rm=minimal",
            "Administracion": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/p_vlxeqdumxd?rm=minimal",
            "Derecho": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/p_nx1zbpumxd?rm=minimal",
            "Medicina": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/p_oj9z03umxd?rm=minimal",
            "Ciencias Biologicas": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/p_a9r2hkvmxd?rm=minimal",
            "Farmacia": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/p_csr7jpvmxd?rm=minimal",
            "Nutricion": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/p_9lqap9vmxd?rm=minimal",
            "Optometria": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/p_ypm0p9vmxd?rm=minimal",
            "Trabajo Social": "https://lookerstudio.google.com/embed/reporting/58666833-613f-47d5-a886-97a800bde66f/page/p_vrt8q9vmxd?rm=minimal"
        };

        graf1.src = urls[area];

        // Marcar opción activa
        menuItems.forEach(li => li.classList.remove("active"));
        item.classList.add("active");
    });
});
