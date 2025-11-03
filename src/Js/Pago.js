document.getElementById('pago-tarjeta').addEventListener('click', mostrarEntregaModal);
document.getElementById('pago-billetera').addEventListener('click', mostrarEntregaModal);

function mostrarEntregaModal() {
    document.getElementById('entrega-modal').classList.remove('hidden');
    document.getElementById('despacho-form').classList.add('hidden');
}

document.getElementById('entrega-modal-close').addEventListener('click', function() {
    document.getElementById('entrega-modal').classList.add('hidden');
});

document.getElementById('retiro-btn').addEventListener('click', function() {
    document.getElementById('despacho-form').classList.add('hidden');
    document.getElementById('entrega-modal').classList.add('hidden');
});

document.getElementById('despacho-btn').addEventListener('click', function() {
    document.getElementById('despacho-form').classList.remove('hidden');
});

document.getElementById('despacho-form').addEventListener('submit', function(e) {
    e.preventDefault();
    document.getElementById('entrega-modal').classList.add('hidden');
});