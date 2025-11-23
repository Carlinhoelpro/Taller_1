function mostrarNombrePerfil() {
    const apiBase = 'http://localhost:3000/api';
    const token = localStorage.getItem('token');
    if (token) {
        fetch(apiBase + '/perfil', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(res => {
                if (!res.ok) throw new Error('No profile');
                return res.json();
            })
            .then(perfil => {
                const nombre = perfil.nombre || localStorage.getItem('usuarioNombre') || 'Usuario';
                document.getElementById('perfil-nombre').textContent = nombre;
                document.getElementById('perfil-nombre-edit').value = nombre;
            })
            .catch(() => {
                const nombre = localStorage.getItem('usuarioNombre') || 'Usuario';
                document.getElementById('perfil-nombre').textContent = nombre;
                document.getElementById('perfil-nombre-edit').value = nombre;
            });
        return;
    }
    let nombre = localStorage.getItem('usuarioNombre') || 'Usuario';
    document.getElementById('perfil-nombre').textContent = nombre;
    document.getElementById('perfil-nombre-edit').value = nombre;
}
mostrarNombrePerfil();

function cargarHistorial() {
    const nombre = localStorage.getItem('usuarioNombre');
    if (!nombre) {
        alert('Debes estar registrado para ver el perfil.');
        window.location.href = 'Inicio.html';
        return;
    }
    const usuarioKey = 'historial_' + nombre;
    const historial = JSON.parse(localStorage.getItem(usuarioKey)) || [];
    const tbody = document.getElementById('historial-body');
    tbody.innerHTML = '';
    if (historial.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No hay pedidos aún.</td></tr>';
        return;
    }
    historial.forEach(p => {
        const tr = document.createElement('tr');
        const fecha = new Date(p.fecha).toLocaleString();
        const items = p.items.map(it => `${it.nombre} x${it.cantidad}`).join(', ');
        tr.innerHTML = `<td>${fecha}</td><td>${items}</td><td>$${p.total}</td>`;
        tbody.appendChild(tr);
    });
}

cargarHistorial();

document.getElementById('editar-nombre-btn').onclick = function() {
    document.getElementById('perfil-nombre').style.display = 'none';
    document.getElementById('perfil-nombre-edit').style.display = '';
    this.style.display = 'none';
    document.getElementById('guardar-nombre-btn').style.display = '';
};
document.getElementById('guardar-nombre-btn').onclick = function() {
    let nuevoNombre = document.getElementById('perfil-nombre-edit').value.trim();
    if (nuevoNombre.length > 0) {
        localStorage.setItem('usuarioNombre', nuevoNombre);
        mostrarNombrePerfil();
    }
    document.getElementById('perfil-nombre').style.display = '';
    document.getElementById('perfil-nombre-edit').style.display = 'none';
    this.style.display = 'none';
    document.getElementById('editar-nombre-btn').style.display = '';
};

document.getElementById('perfil-img-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            document.getElementById('perfil-img').src = evt.target.result;
            localStorage.setItem('perfilImg', evt.target.result);
        };
        reader.readAsDataURL(file);
    }
});
const imgGuardada = localStorage.getItem('perfilImg');
if (imgGuardada) {
    document.getElementById('perfil-img').src = imgGuardada;
}