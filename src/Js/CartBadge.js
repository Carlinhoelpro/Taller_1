function getCarrito() {
    return JSON.parse(localStorage.getItem('carrito')) || [];
}

function getCarritoCount() {
    const carrito = getCarrito();
    return carrito.reduce((acc, item) => acc + (parseInt(item.cantidad) || 0), 0);
}

function updateCartBadge() {
    const badge = document.querySelector('.carrito-badge');
    if (!badge) return;
    const count = getCarritoCount();
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'inline-block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});

window.addEventListener('cartUpdated', updateCartBadge);

window.addEventListener('storage', (e) => {
    if (e.key === 'carrito') updateCartBadge();
});

window.updateCartBadge = updateCartBadge;
