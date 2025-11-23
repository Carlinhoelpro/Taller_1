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

document.addEventListener('click', function(e) {
    const btn = e.target.closest('.producto-boton');
    if (!btn) return;
    const nombre = btn.getAttribute('data-nombre') || (btn.closest('.producto') && btn.closest('.producto').querySelector('.producto-nombre')?.textContent);
    const precioAttr = btn.getAttribute('data-precio');
    let precio = 0;
    if (precioAttr) {
        precio = parseInt(precioAttr, 10);
    } else {
        const precioText = btn.closest('.producto')?.querySelector('.producto-precio')?.textContent || '';
        precio = parseInt((precioText || '').replace(/\D/g, ''), 10) || 0;
    }
    const id = btn.getAttribute('data-id') || btn.closest('.producto')?.getAttribute('data-id') || null;

    if (typeof window.agregarAlCarrito === 'function') {
        window.agregarAlCarrito(nombre, precio, id);
    } else {
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        let idx = carrito.findIndex(item => item.nombre === nombre);
        if (idx >= 0) {
            if (carrito[idx].cantidad < 15) carrito[idx].cantidad++;
            else alert('No puedes agregar más de 15 unidades.');
        } else {
            const newItem = { nombre, precio, cantidad: 1 };
            if (id) newItem.id_producto = id;
            carrito.push(newItem);
        }
        localStorage.setItem('carrito', JSON.stringify(carrito));
        try { window.dispatchEvent(new Event('cartUpdated')); } catch (e) {}
        alert('Producto agregado al carrito');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const apiBase = (window.APP_CONFIG && window.APP_CONFIG.apiBase) || 'http://localhost:3000/api';
    try {
        const res = await fetch(apiBase + '/productos');
        if (!res.ok) return; 
        const productos = await res.json();
        document.querySelectorAll('.producto').forEach(prodEl => {
            const nameEl = prodEl.querySelector('.producto-nombre');
            const btn = prodEl.querySelector('.producto-boton');
            if (!nameEl || !btn) return;
            const nombre = nameEl.textContent.trim().toLowerCase();
            const match = productos.find(p => p.nombre && p.nombre.toLowerCase().trim() === nombre);
            if (match && (match.id_producto || match.id)) {
                prodEl.setAttribute('data-id', match.id_producto || match.id);
                btn.setAttribute('data-id', match.id_producto || match.id);
            }
        });
    } catch (err) {
    }
});