const modal = document.getElementById('entrega-modal');
const modalContent = modal.querySelector('.usuario-modal-content');
const closeBtn = document.getElementById('entrega-modal-close');
let chosenPaymentMethod = null; 

function openModal(html) {
    const title = modalContent.querySelector('h2');
    if (title) title.textContent = '';
    const bodyArea = document.createElement('div');
    bodyArea.innerHTML = html;
    const existing = modalContent.querySelector('.dynamic-area');
    if (existing) existing.remove();
    bodyArea.classList.add('dynamic-area');
    modalContent.appendChild(bodyArea);
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    const existing = modalContent.querySelector('.dynamic-area');
    if (existing) existing.remove();
}

closeBtn.addEventListener('click', closeModal);

document.getElementById('pago-tarjeta').addEventListener('click', function() {
    const html = `
        <div style="margin-bottom:.5rem;">Seleccione tipo de tarjeta:</div>
        <div style="display:flex;gap:.5rem;margin-bottom:1rem;">
            <button id="opt-credito" class="usuario-modal-submit">Crédito</button>
            <button id="opt-debito" class="usuario-modal-submit">Débito</button>
        </div>
    `;
    openModal(html);
    setTimeout(() => {
        document.getElementById('opt-credito').addEventListener('click', () => {
            chosenPaymentMethod = 'Tarjeta - Crédito';
            openDeliveryModal();
        });
        document.getElementById('opt-debito').addEventListener('click', () => {
            chosenPaymentMethod = 'Tarjeta - Débito';
            openDeliveryModal();
        });
    }, 50);
});

document.getElementById('pago-billetera').addEventListener('click', function() {
    const html = `
        <div style="margin-bottom:.5rem;">Seleccione billetera virtual:</div>
        <div style="display:flex;gap:.5rem;margin-bottom:1rem;">
            <button id="opt-paypal" class="usuario-modal-submit">Paypal</button>
            <button id="opt-mercado" class="usuario-modal-submit">Mercado Pago</button>
        </div>
    `;
    openModal(html);
    setTimeout(() => {
        document.getElementById('opt-paypal').addEventListener('click', () => {
            chosenPaymentMethod = 'Billetera - Paypal';
            openDeliveryModal();
        });
        document.getElementById('opt-mercado').addEventListener('click', () => {
            chosenPaymentMethod = 'Billetera - Mercado Pago';
            openDeliveryModal();
        });
    }, 50);
});

function openDeliveryModal() {
    const html = `
        <div style="margin-bottom:.5rem;font-weight:600;">Método de pago: ${chosenPaymentMethod || ''}</div>
        <div style="margin-bottom:.5rem;">¿Cómo quieres recibir tu pedido?</div>
        <div style="display:flex;gap:.5rem;margin-bottom:1rem;">
            <button id="retiro-btn" class="usuario-modal-submit">Retiro en local</button>
            <button id="despacho-btn" class="usuario-modal-submit">Despacho a domicilio</button>
        </div>
        <div id="delivery-area"></div>
    `;
    openModal(html);

    setTimeout(() => {
        const retiroBtn = document.getElementById('retiro-btn');
        const despachoBtn = document.getElementById('despacho-btn');
        const deliveryArea = document.getElementById('delivery-area');

        retiroBtn.addEventListener('click', () => {
            deliveryArea.innerHTML = `<div style="margin-top:.5rem;text-align:center;"><button id="aceptar-retiro" class="usuario-modal-submit">Aceptar</button></div>`;
            document.getElementById('aceptar-retiro').addEventListener('click', () => processOrder(null));
        });

        despachoBtn.addEventListener('click', () => {
            deliveryArea.innerHTML = `
                <form id="direccion-form">
                    <label for="calle">Calle y número</label><br>
                    <input id="calle" name="calle" type="text" required style="width:100%;padding:.4rem;margin-bottom:.5rem;" placeholder="Ej: Av. Siempre Viva 742"><br>
                    <label for="comuna">Comuna</label><br>
                    <input id="comuna" name="comuna" type="text" required style="width:100%;padding:.4rem;margin-bottom:1rem;" placeholder="Ej: Santiago"><br>
                    <div style="text-align:right;"><button type="submit" id="confirmar-despacho" class="usuario-modal-submit">Aceptar</button></div>
                </form>
            `;
            document.getElementById('direccion-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const calle = document.getElementById('calle').value.trim();
                const comuna = document.getElementById('comuna').value.trim();
                if (!calle || !comuna) { alert('Completa la dirección.'); return; }
                processOrder({ calle, comuna });
            });
        });
    }, 50);
}

async function processOrder(deliveryAddress) {
    const usuario = localStorage.getItem('usuarioNombre');
    if (!usuario) {
        alert('Debes estar registrado/iniciado sesión para completar la compra.');
        closeModal();
        window.location.href = 'Inicio.html';
        return;
    }

    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) { alert('Carrito vacío.'); closeModal(); return; }
    let total = 0;
    carrito.forEach(i => total += (i.precio * i.cantidad));

    const pedidoLocal = {
        fecha: new Date().toISOString(),
        items: carrito,
        total,
        direccion: deliveryAddress || { tipo: 'Retiro en local' },
        metodo: chosenPaymentMethod || ''
    };

    const apiBase = (window.APP_CONFIG && window.APP_CONFIG.apiBase) || 'http://localhost:3000/api';
    const token = localStorage.getItem('token');

    const saveLocalHistory = (record) => {
        const usuarioKey = 'historial_' + (localStorage.getItem('usuarioNombre') || 'invitado');
        const historial = JSON.parse(localStorage.getItem(usuarioKey)) || [];
        historial.unshift(record);
        localStorage.setItem(usuarioKey, JSON.stringify(historial));
    };

    try {
        if (token) {
            const productosRes = await fetch(apiBase + '/productos');
            if (!productosRes.ok) throw new Error('No fue posible obtener productos desde la API');
            const productos = await productosRes.json();

            const detalles = carrito.map(item => {
                if (item.id_producto || item.id) {
                    return { id_producto: item.id_producto || item.id, cantidad: item.cantidad };
                }
                const match = productos.find(p => {
                    if (!p.nombre || !item.nombre) return false;
                    return p.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim()
                        || p.nombre.toLowerCase().includes(item.nombre.toLowerCase().split(' ')[0]);
                });
                if (!match) throw new Error('Producto ' + item.nombre + ' no encontrado en la API');
                return { id_producto: match.id_producto || match.id || match._id, cantidad: item.cantidad };
            });

            const postRes = await fetch(apiBase + '/pedidos', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ detalles })
            });

            if (!postRes.ok) {
                console.warn('API pedidos falló, guardando localmente');
                saveLocalHistory(pedidoLocal);
            } else {
                const postData = await postRes.json();
                const serverRecord = Object.assign({ serverPedido: postData.pedido || postData }, pedidoLocal);
                saveLocalHistory(serverRecord);
            }
        } else {
            saveLocalHistory(pedidoLocal);
        }
    } catch (err) {
        console.warn('Error al intentar enviar pedido al API:', err.message);
        saveLocalHistory(pedidoLocal);
    }

    try {
        const { jsPDF } = window.jspdf || {};
        if (typeof jsPDF === 'function') {
            const doc = new jsPDF();
            doc.setFontSize(14);
            doc.text('Factura - Tokyo Noodles', 14, 20);
            doc.setFontSize(10);
            doc.text('Fecha: ' + new Date(pedidoLocal.fecha).toLocaleString(), 14, 30);
            doc.text('Cliente: ' + (localStorage.getItem('usuarioNombre') || 'Invitado'), 14, 36);
            const dirText = deliveryAddress ? (deliveryAddress.calle + ' - ' + deliveryAddress.comuna) : 'Retiro en local';
            doc.text('Dirección: ' + dirText, 14, 42);
            let y = 52;
            doc.text('Items:', 14, y);
            y += 6;
            pedidoLocal.items.forEach(it => {
                const line = `${it.cantidad} x ${it.nombre}  — $${(it.precio*it.cantidad).toFixed(0)}`;
                doc.text(line, 14, y);
                y += 6;
                if (y > 270) { doc.addPage(); y = 20; }
            });
            doc.text('Total: $' + pedidoLocal.total.toFixed(0), 14, y + 8);
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            doc.save('factura_tokyo_' + stamp + '.pdf');
        }
    } catch (err) {
        console.warn('No fue posible generar PDF:', err.message);
    }

    // show thank you message and 'Volver' button inside modal
    const thankYouHtml = `
        <div style="text-align:center;padding:1rem;">
            <h3>Gracias por la compra</h3>
            <p>Tu pedido se registró en tu perfil.</p>
            <div style="margin-top:1rem;"><button id="volver-inicio" class="usuario-modal-submit">Volver</button></div>
        </div>
    `;
    openModal(thankYouHtml);
    setTimeout(() => {
        document.getElementById('volver-inicio').addEventListener('click', () => {
            localStorage.removeItem('carrito');
            closeModal();
            window.location.href = '../../index.html';
        });
    }, 50);
}