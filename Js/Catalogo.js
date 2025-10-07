const filtroBtn = document.getElementById('filtro-btn');
const filtroMenu = document.getElementById('filtro-menu');
const filtroOpciones = document.querySelectorAll('.filtro-opcion');
const categorias = document.querySelectorAll('.categoria');

filtroBtn.addEventListener('click', () => {
    filtroMenu.classList.toggle('hidden');
});
document.addEventListener('click', (e) => {
    if (!filtroMenu.contains(e.target) && !filtroBtn.contains(e.target)) {
        filtroMenu.classList.add('hidden');
    }
});
filtroOpciones.forEach(btn => {
    btn.addEventListener('click', () => {
        const filtro = btn.getAttribute('data-filtro');
        categorias.forEach(cat => {
            if (filtro === 'todo' || cat.querySelector('h2').textContent.toLowerCase() === filtro) {
                cat.style.display = '';
            } else {
                cat.style.display = 'none';
            }
        });
        filtroMenu.classList.add('hidden');
    });
});