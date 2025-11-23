function getCarrito() {
    return JSON.parse(localStorage.getItem('carrito')) || [];
}
function setCarrito(carrito) {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    try { window.dispatchEvent(new Event('cartUpdated')); } catch (e) { /* ignore */ }
}
function renderCarrito() {
    const tbody = document.getElementById('carrito-body');
    const carrito = getCarrito();
    tbody.innerHTML = '';
    let total = 0;
    carrito.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nombre}</td>
                    <td>
                        <button class="carrito-accion-btn" data-idx="${idx}" data-accion="sumar">+</button>
                        <input type="number" min="1" max="12" value="${item.cantidad}" class="carrito-cantidad-input" data-idx="${idx}">
                    </td>
            <td>$${item.precio * item.cantidad}</td>
            <td>
                <button class="carrito-accion-btn" data-idx="${idx}" data-accion="eliminar">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
        total += item.precio * item.cantidad;
    });
    document.getElementById('carrito-total').textContent = '$' + total;
}
document.addEventListener('DOMContentLoaded', renderCarrito);

document.getElementById('carrito-body').addEventListener('click', function(e) {
    const btn = e.target.closest('.carrito-accion-btn');
    if (!btn) return;
    const idx = parseInt(btn.getAttribute('data-idx'));
    const accion = btn.getAttribute('data-accion');
    let carrito = getCarrito();
    if (accion === 'sumar') {
        if (carrito[idx].cantidad < 12) {
            carrito[idx].cantidad++;
        } else {
            alert('No hay stock suficiente');
        }
    } else if (accion === 'eliminar') {
        carrito.splice(idx, 1);
    }
    setCarrito(carrito);
    renderCarrito();
});
document.getElementById('carrito-body').addEventListener('input', function(e) {
    if (e.target.classList.contains('carrito-cantidad-input')) {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 12) {
            alert('No hay stock suficiente');
            val = 12;
        }
        let carrito = getCarrito();
        carrito[idx].cantidad = val;
        setCarrito(carrito);
        renderCarrito();
    }
});

document.getElementById('pagar-btn').addEventListener('click', function() {
    const carrito = getCarrito();
    if (carrito.length === 0) {
        alert('El carrito está vacío.');
        return;
    }
    let resumen = '<table style="width:100%;margin-bottom:1rem;"><tr><th>Producto</th><th>Cantidad</th><th>Precio</th></tr>';
    let total = 0;
    carrito.forEach(item => {
        resumen += `<tr><td>${item.nombre}</td><td>${item.cantidad}</td><td>$${item.precio * item.cantidad}</td></tr>`;
        total += item.precio * item.cantidad;
    });
    resumen += `</table><div style="font-weight:bold;">Total: $${total}</div>`;
    document.getElementById('resumen-contenido').innerHTML = resumen;
    document.getElementById('resumen-modal').classList.remove('hidden');
});
document.getElementById('resumen-modal-close').addEventListener('click', function() {
    document.getElementById('resumen-modal').classList.add('hidden');
});
document.getElementById('confirmar-compra').addEventListener('click', function() {
    window.location.href = "Pago.html";
});

document.getElementById('descargar-pdf').addEventListener('click', function() {
    alert('Funcionalidad de PDF no implementada aquí. Usa jsPDF o similar.');
});
document.getElementById('enviar-correo').addEventListener('click', function() {
    alert('Funcionalidad de envío por correo no implementada aquí.');
});

function agregarAlCarrito(nombre, precio, id) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    let idx = carrito.findIndex(item => item.nombre === nombre);
    if (idx >= 0) {
        if (carrito[idx].cantidad < 12) {
            carrito[idx].cantidad++;
        } else {
            alert('No hay stock suficiente');
        }
    } else {
        const newItem = { nombre, precio, cantidad: 1 };
        if (id) newItem.id_producto = id;
        carrito.push(newItem);
    }
    localStorage.setItem('carrito', JSON.stringify(carrito));
    try { window.dispatchEvent(new Event('cartUpdated')); } catch (e) {}
    alert('Producto agregado al carrito');
}